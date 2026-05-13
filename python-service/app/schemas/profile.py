from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PetCreateRequest(BaseModel):
    user_id: UUID
    name: str
    breed: str | None = None
    weight: str | None = None
    vaccine: str | None = None
    certificate: str | None = None
    avatar: str | None = None


class PetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    breed: str | None = None
    weight: str | None = None
    vaccine: str | None = None
    certificate: str | None = None
    avatar: str | None = None
    created_at: datetime
    updated_at: datetime


class AddressCreateRequest(BaseModel):
    user_id: UUID
    label: str
    address: str
    contact_name: str | None = None
    contact_phone: str | None = None
    district: str | None = None
    lat: float | None = None
    lng: float | None = None
    coord_system: str = "gcj02"
    is_default: bool = False


class AddressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    label: str
    contact_name: str | None = None
    contact_phone: str | None = None
    district: str | None = None
    address: str
    lat: float | None = None
    lng: float | None = None
    coord_system: str
    is_default: bool
    created_at: datetime
    updated_at: datetime


class ProviderApplicationCreateRequest(BaseModel):
    user_id: UUID
    services: list[str] = Field(default_factory=list)
    base_district: str | None = None
    intro: str | None = None
    experience: str | None = None
    credential_urls: list[str] = Field(default_factory=list)


class ProviderApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    services: list[str]
    base_district: str | None = None
    intro: str | None = None
    experience: str | None = None
    credential_urls: list[str]
    status: str
    review_note: str | None = None
    reviewed_by: UUID | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
