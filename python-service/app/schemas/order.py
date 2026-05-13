from pydantic import BaseModel, Field

from app.schemas.common import InternalRequestMeta


class CaregiverSnapshotDTO(BaseModel):
    user_id: str
    nickname: str
    avatar: str | None = None
    cat_care_score: float | None = None
    tags: list[str] = Field(default_factory=list)
    supports_medication: bool | None = None
    supports_multi_day_care: bool | None = None


class DriverSnapshotDTO(BaseModel):
    user_id: str
    nickname: str
    avatar: str | None = None
    pet_friendly_score: float | None = None
    tags: list[str] = Field(default_factory=list)
    vehicle_type: str | None = None


class OrderSnapshotRequest(BaseModel):
    meta: InternalRequestMeta
    order_id: str
    provider_user_id: str
    vehicle_id: str | None = None


class OrderSnapshotResponse(BaseModel):
    request_id: str
    order_id: str
    caregiver_snapshot: CaregiverSnapshotDTO | None = None
    driver_snapshot: DriverSnapshotDTO | None = None
