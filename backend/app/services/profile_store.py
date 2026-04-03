from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings
from app.models.profile import PremedProfileInput, StoredPremedProfile


class ProfileStore:
    def __init__(self) -> None:
        settings = get_settings()
        self.base_url = f"{settings.supabase_url}/rest/v1/profiles"
        self.headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        }

    async def _request(
        self,
        method: str,
        *,
        params: dict[str, str] | None = None,
        json_body: dict[str, Any] | None = None,
        prefer: str | None = None,
    ) -> Any:
        headers = dict(self.headers)
        if prefer:
            headers["Prefer"] = prefer

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.request(
                method,
                self.base_url,
                params=params,
                headers=headers,
                json=json_body,
            )

        if response.status_code >= 400:
            raise RuntimeError(f"Supabase request failed with {response.status_code}: {response.text}")
        if not response.text:
            return None
        return response.json()

    @staticmethod
    def _hydrate_profile(row: dict[str, Any]) -> StoredPremedProfile:
        return StoredPremedProfile.model_validate(
            {
                **row["profile_data"],
                "id": row["id"],
                "userId": row["user_id"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
            }
        )

    async def list_profiles_for_user(self, user_id: str) -> list[StoredPremedProfile]:
        rows = await self._request(
            "GET",
            params={
                "select": "*",
                "user_id": f"eq.{user_id}",
                "order": "updated_at.desc",
            },
        )
        return [self._hydrate_profile(row) for row in rows]

    async def get_profile_for_user(self, user_id: str, profile_id: str) -> StoredPremedProfile | None:
        rows = await self._request(
            "GET",
            params={
                "select": "*",
                "id": f"eq.{profile_id}",
                "user_id": f"eq.{user_id}",
            },
        )
        if not rows:
            return None
        return self._hydrate_profile(rows[0])

    async def create_profile_for_user(self, user_id: str, profile: PremedProfileInput) -> StoredPremedProfile:
        rows = await self._request(
            "POST",
            json_body={
                "user_id": user_id,
                "profile_data": profile.model_dump(),
            },
            prefer="return=representation",
        )
        return self._hydrate_profile(rows[0])

    async def update_profile_for_user(
        self,
        user_id: str,
        profile_id: str,
        profile: PremedProfileInput,
    ) -> StoredPremedProfile | None:
        rows = await self._request(
            "PATCH",
            params={
                "id": f"eq.{profile_id}",
                "user_id": f"eq.{user_id}",
                "select": "*",
            },
            json_body={"profile_data": profile.model_dump()},
            prefer="return=representation",
        )
        if not rows:
            return None
        return self._hydrate_profile(rows[0])

    async def delete_profile_for_user(self, user_id: str, profile_id: str) -> bool:
        await self._request(
            "DELETE",
            params={
                "id": f"eq.{profile_id}",
                "user_id": f"eq.{user_id}",
            },
        )
        return True


profile_store = ProfileStore()
