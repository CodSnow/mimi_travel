from pydantic import BaseModel, Field

from app.schemas.common import InternalRequestMeta


class LocationDTO(BaseModel):
    lat: float
    lng: float
    address: str


class CareRequirementsDTO(BaseModel):
    need_home_visit: bool | None = None
    need_cleaning: bool | None = None
    need_medication: bool | None = None
    need_photo_feedback: bool | None = None
    need_video_feedback: bool | None = None
    need_multi_day_care: bool | None = None
    visit_times_per_day: int | None = None
    estimated_duration_minutes: int | None = None
    has_multiple_pets: bool | None = None
    caregiver_preference: str | None = None
    require_cat_care_experience: bool | None = None


class RideRequirementsDTO(BaseModel):
    pet_count: int | None = None
    pet_size: str | None = None
    carrier_type: str | None = None
    accept_normal_taxi: bool | None = None
    require_pet_friendly_vehicle: bool | None = None
    require_large_trunk: bool | None = None
    require_stable_driving: bool | None = None
    require_low_odor: bool | None = None


class CaregiverMatchDemandDTO(BaseModel):
    id: str
    user_id: str
    district: str | None = None
    service_type: str
    budget_min: int
    budget_max: int
    service_time: str
    pickup: LocationDTO | None = None
    care_requirements: CareRequirementsDTO | None = None


class CaregiverMatchRequest(BaseModel):
    meta: InternalRequestMeta
    demand: CaregiverMatchDemandDTO
    page: int | None = 1
    page_size: int | None = 20


class CaregiverProfileSnapshotDTO(BaseModel):
    nickname: str
    avatar: str | None = None
    cat_care_score: float | None = None
    communication_score: float | None = None
    punctuality_score: float | None = None
    tags: list[str] = Field(default_factory=list)
    completed_order_count: int = 0
    supports_home_visit: bool | None = None
    supports_medication: bool | None = None
    supports_multi_day_care: bool | None = None


class CaregiverMatchCandidateDTO(BaseModel):
    provider_user_id: str
    score: float
    distance_km: float | None = None
    reasons: list[str] = Field(default_factory=list)
    price_hint_min: int | None = None
    price_hint_max: int | None = None
    profile_snapshot: CaregiverProfileSnapshotDTO


class CaregiverMatchResponse(BaseModel):
    request_id: str
    candidates: list[CaregiverMatchCandidateDTO]


class DriverMatchDemandDTO(BaseModel):
    id: str
    user_id: str
    district: str | None = None
    service_type: str
    budget_min: int
    budget_max: int
    service_time: str
    pickup: LocationDTO | None = None
    destination: LocationDTO | None = None
    ride_requirements: RideRequirementsDTO | None = None


class DriverMatchRequest(BaseModel):
    meta: InternalRequestMeta
    demand: DriverMatchDemandDTO
    page: int | None = 1
    page_size: int | None = 20


class DriverProfileSnapshotDTO(BaseModel):
    nickname: str
    avatar: str | None = None
    pet_friendly_score: float | None = None
    driving_stability_score: float | None = None
    cleanliness_score: float | None = None
    punctuality_score: float | None = None
    tags: list[str] = Field(default_factory=list)
    completed_order_count: int = 0


class VehicleSnapshotDTO(BaseModel):
    vehicle_type: str
    trunk_level: str | None = None
    supports_cat_bag: bool
    supports_crate: bool
    supports_stroller: bool
    supports_multi_pet: bool
    pet_friendly: bool
    pet_friendly_tags: list[str] = Field(default_factory=list)


class DriverMatchCandidateDTO(BaseModel):
    provider_user_id: str
    vehicle_id: str | None = None
    score: float
    distance_km: float | None = None
    eta_minutes: int | None = None
    reasons: list[str] = Field(default_factory=list)
    profile_snapshot: DriverProfileSnapshotDTO
    vehicle_snapshot: VehicleSnapshotDTO | None = None


class DriverMatchResponse(BaseModel):
    request_id: str
    candidates: list[DriverMatchCandidateDTO]
