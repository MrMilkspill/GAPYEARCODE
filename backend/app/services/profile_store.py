from __future__ import annotations

from datetime import datetime, timezone
import json
from typing import Any
from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.models.profile import PremedProfileInput, StoredPremedProfile


class ProfileStore:
    def __init__(self) -> None:
        settings = get_settings()
        self.bucket_name = "premed-profiles"
        self.storage_base_url = f"{settings.supabase_url}/storage/v1"
        self.headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
        }
        self._bucket_checked = False

    async def _storage_request(
        self,
        method: str,
        path: str,
        *,
        json_body: Any | None = None,
        raw_body: str | None = None,
        extra_headers: dict[str, str] | None = None,
    ) -> Any:
        headers = dict(self.headers)
        if extra_headers:
            headers.update(extra_headers)

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.request(
                method,
                f"{self.storage_base_url}{path}",
                headers=headers,
                json=json_body,
                content=raw_body,
            )

        if response.status_code >= 400:
            raise RuntimeError(
                f"Supabase storage request failed with {response.status_code}: {response.text}"
            )

        content_type = response.headers.get("content-type", "")
        if not response.text:
            return None
        if "application/json" in content_type:
            return response.json()
        return response.text

    async def _ensure_bucket_exists(self) -> None:
        if self._bucket_checked:
            return

        buckets = await self._storage_request("GET", "/bucket")
        if isinstance(buckets, list) and any(
            isinstance(bucket, dict) and bucket.get("name") == self.bucket_name for bucket in buckets
        ):
            self._bucket_checked = True
            return

        await self._storage_request(
            "POST",
            "/bucket",
            json_body={
                "id": self.bucket_name,
                "name": self.bucket_name,
                "public": False,
            },
            extra_headers={"Content-Type": "application/json"},
        )
        self._bucket_checked = True

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _object_path(user_id: str, profile_id: str) -> str:
        return f"{user_id}/{profile_id}.json"

    @staticmethod
    def _hydrate_profile(payload: dict[str, Any]) -> StoredPremedProfile:
        return StoredPremedProfile.model_validate(
            {
                **payload["profileData"],
                "id": payload["id"],
                "userId": payload["userId"],
                "createdAt": payload["createdAt"],
                "updatedAt": payload["updatedAt"],
            }
        )

    async def _read_profile_object(
        self,
        user_id: str,
        profile_id: str,
    ) -> StoredPremedProfile | None:
        await self._ensure_bucket_exists()

        try:
            payload = await self._storage_request(
                "GET",
                f"/object/{self.bucket_name}/{self._object_path(user_id, profile_id)}",
            )
        except RuntimeError as error:
            if "404" in str(error):
                return None
            raise

        if not isinstance(payload, dict):
            raise RuntimeError("Supabase storage returned an invalid profile payload.")

        return self._hydrate_profile(payload)

    async def list_profiles_for_user(self, user_id: str) -> list[StoredPremedProfile]:
        await self._ensure_bucket_exists()

        entries = await self._storage_request(
            "POST",
            f"/object/list/{self.bucket_name}",
            json_body={
                "prefix": user_id,
                "limit": 1000,
                "offset": 0,
            },
            extra_headers={"Content-Type": "application/json"},
        )

        if not isinstance(entries, list):
            raise RuntimeError("Supabase storage returned an invalid profile listing.")

        profiles: list[StoredPremedProfile] = []
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            name = entry.get("name")
            if not isinstance(name, str) or not name.endswith(".json"):
                continue
            profile = await self._read_profile_object(user_id, name[:-5])
            if profile:
                profiles.append(profile)

        profiles.sort(key=lambda profile: profile.updatedAt, reverse=True)
        return profiles

    async def get_profile_for_user(self, user_id: str, profile_id: str) -> StoredPremedProfile | None:
        return await self._read_profile_object(user_id, profile_id)

    async def create_profile_for_user(self, user_id: str, profile: PremedProfileInput) -> StoredPremedProfile:
        await self._ensure_bucket_exists()

        profile_id = str(uuid4())
        timestamp = self._now_iso()
        payload = {
            "id": profile_id,
            "userId": user_id,
            "createdAt": timestamp,
            "updatedAt": timestamp,
            "profileData": profile.model_dump(),
        }

        await self._storage_request(
            "POST",
            f"/object/{self.bucket_name}/{self._object_path(user_id, profile_id)}",
            raw_body=json.dumps(payload),
            extra_headers={
                "Content-Type": "application/json",
                "x-upsert": "true",
            },
        )

        return self._hydrate_profile(payload)

    async def update_profile_for_user(
        self,
        user_id: str,
        profile_id: str,
        profile: PremedProfileInput,
    ) -> StoredPremedProfile | None:
        existing = await self._read_profile_object(user_id, profile_id)
        if not existing:
            return None

        payload = {
            "id": profile_id,
            "userId": user_id,
            "createdAt": existing.createdAt.isoformat(),
            "updatedAt": self._now_iso(),
            "profileData": profile.model_dump(),
        }

        await self._storage_request(
            "POST",
            f"/object/{self.bucket_name}/{self._object_path(user_id, profile_id)}",
            raw_body=json.dumps(payload),
            extra_headers={
                "Content-Type": "application/json",
                "x-upsert": "true",
            },
        )

        return self._hydrate_profile(payload)

    async def delete_profile_for_user(self, user_id: str, profile_id: str) -> bool:
        await self._ensure_bucket_exists()

        try:
            await self._storage_request(
                "DELETE",
                f"/object/{self.bucket_name}/{self._object_path(user_id, profile_id)}",
            )
        except RuntimeError as error:
            if "404" in str(error):
                return False
            raise

        return True


profile_store = ProfileStore()
