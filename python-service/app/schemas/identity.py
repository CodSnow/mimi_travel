from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    phone: str = Field(min_length=1, max_length=32)
    nickname: str = Field(min_length=1, max_length=64)
    avatar: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: str
    nickname: str
    avatar: str | None = None
    role: str
    verified: bool
    created_at: datetime
    updated_at: datetime


class LoginSessionResponse(BaseModel):
    token: str
    expires_at: datetime


class LoginResponse(BaseModel):
    user: UserResponse
    session: LoginSessionResponse
