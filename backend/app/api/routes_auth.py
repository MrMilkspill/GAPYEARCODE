from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.models.auth import RegisterAccountRequest, RegisterAccountResponse


router = APIRouter(prefix="/auth", tags=["auth"])
_DUPLICATE_ACCOUNT_MESSAGE = "An account with this email already exists."


def _extract_error_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        payload = None

    if isinstance(payload, dict):
        for key in ("msg", "message", "error_description", "error"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    return "Unable to create account."


def _is_duplicate_account_error(message: str) -> bool:
    normalized_message = message.lower()
    return "already" in normalized_message or "registered" in normalized_message


@router.post("/register", response_model=RegisterAccountResponse, status_code=status.HTTP_201_CREATED)
async def register_account(payload: RegisterAccountRequest) -> RegisterAccountResponse:
    settings = get_settings()

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            f"{settings.supabase_url}/auth/v1/admin/users",
            headers={
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "apikey": settings.supabase_service_role_key,
                "Content-Type": "application/json",
            },
            json={
                "email": payload.email,
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {"full_name": payload.full_name},
            },
        )

    if response.status_code >= 400:
        detail = _extract_error_message(response)
        if _is_duplicate_account_error(detail):
            status_code = status.HTTP_409_CONFLICT
            detail = _DUPLICATE_ACCOUNT_MESSAGE
        elif 400 <= response.status_code < 500:
            status_code = status.HTTP_400_BAD_REQUEST
        else:
            status_code = status.HTTP_502_BAD_GATEWAY
        raise HTTPException(status_code=status_code, detail=detail)

    data = response.json()
    user = data.get("user") if isinstance(data, dict) and isinstance(data.get("user"), dict) else data

    if not isinstance(user, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Supabase returned an invalid registration response.",
        )

    return RegisterAccountResponse(
        user={
            "id": user.get("id"),
            "email": user.get("email"),
        }
    )
