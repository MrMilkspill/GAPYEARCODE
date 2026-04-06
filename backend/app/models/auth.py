from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RegisterAccountRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=320)
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=72)

    @field_validator("email", "full_name", "password", mode="before")
    @classmethod
    def strip_string_fields(cls, value: object) -> str:
        if value is None:
            return ""
        if not isinstance(value, str):
            return str(value)
        return value.strip()


class RegisterAccountResponse(BaseModel):
    user: dict[str, str | None]
