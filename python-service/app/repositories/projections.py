from dataclasses import dataclass, field
from datetime import datetime


@dataclass(slots=True)
class VehicleProjection:
    id: str
    user_id: str
    vehicle_type: str
    plate_masked: str
    seats: int
    trunk_level: str | None
    supports_cat_bag: bool
    supports_crate: bool
    supports_stroller: bool
    supports_multi_pet: bool
    pet_friendly: bool
    pet_friendly_tags: list[str] = field(default_factory=list)


@dataclass(slots=True)
class ProviderProjection:
    user_id: str
    nickname: str
    phone: str
    avatar: str | None
    role: str
    verified: bool
    status: str
    services: list[str] = field(default_factory=list)
    intro: str | None = None
    service_radius_km: int = 5
    base_district: str | None = None
    score: float | None = None
    completed_order_count: int = 0
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
    cat_care_tags: list[str] = field(default_factory=list)
    vehicles: list[VehicleProjection] = field(default_factory=list)
    lat: float | None = None
    lng: float | None = None


@dataclass(slots=True)
class ReviewProjection:
    reviewee_user_id: str
    overall_score: float
    cat_care_score: float | None = None
    pet_friendly_score: float | None = None
    driving_stability_score: float | None = None
    punctuality_score: float | None = None
    cleanliness_score: float | None = None
    communication_score: float | None = None
    feedback_completeness_score: float | None = None
    medication_accuracy_score: float | None = None
    supports_pet_handling_score: float | None = None
    tags: list[str] = field(default_factory=list)
    created_at: datetime | None = None


@dataclass(slots=True)
class ServiceFeedbackProjection:
    order_id: str
    provider_user_id: str
    photo_urls: list[str] = field(default_factory=list)
    video_urls: list[str] = field(default_factory=list)
    created_at: datetime | None = None
