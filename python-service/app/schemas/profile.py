from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.identity import UserResponse


class PetCreateRequest(BaseModel):
    user_id: UUID
    name: str = Field(min_length=1, max_length=64)
    breed: str | None = Field(default=None, max_length=64)
    weight: str | None = Field(default=None, max_length=32)
    vaccine: str | None = Field(default=None, max_length=128)
    certificate: str | None = Field(default=None, max_length=128)
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
    label: str = Field(min_length=1, max_length=64)
    address: str = Field(min_length=1)
    contact_name: str | None = Field(default=None, max_length=64)
    contact_phone: str | None = Field(default=None, max_length=32)
    district: str | None = Field(default=None, max_length=64)
    lat: float | None = None
    lng: float | None = None
    coord_system: str = Field(default="gcj02", max_length=16)
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
    base_district: str | None = Field(default=None, max_length=64)
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


class VehicleProfileResponse(BaseModel):
    id: str
    user_id: str
    vehicle_type: str
    plate_masked: str
    seats: int
    trunk_level: str | None = None
    supports_cat_bag: bool
    supports_crate: bool
    supports_stroller: bool
    supports_multi_pet: bool
    pet_friendly: bool
    pet_friendly_tags: list[str]


class PublicProviderResponse(BaseModel):
    user_id: str
    nickname: str
    phone: str
    avatar: str | None = None
    role: str
    verified: bool
    status: str
    services: list[str]
    intro: str | None = None
    service_radius_km: int
    base_district: str | None = None
    score: float | None = None
    completed_order_count: int
    cat_care_score: float | None = None
    communication_score: float | None = None
    punctuality_score: float | None = None
    emergency_handling_score: float | None = None
    pet_friendly_score: float | None = None
    driving_stability_score: float | None = None
    cleanliness_score: float | None = None
    supports_home_visit: bool | None = None
    supports_medication: bool | None = None
    supports_multi_day_care: bool | None = None
    supports_emergency_order: bool | None = None
    cat_care_tags: list[str]


class PublicProviderBundleResponse(BaseModel):
    user: UserResponse
    provider: PublicProviderResponse
    vehicles: list[VehicleProfileResponse]


class PublicProviderListResponse(BaseModel):
    items: list[PublicProviderResponse]
