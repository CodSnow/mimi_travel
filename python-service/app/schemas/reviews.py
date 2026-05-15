from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import InternalRequestMeta


class TagSummaryDTO(BaseModel):
    tag: str
    count: int


class ProviderReviewSummaryRequest(BaseModel):
    meta: InternalRequestMeta
    provider_user_id: str


class ProviderReviewSummaryResponse(BaseModel):
    request_id: str
    provider_user_id: str
    overall_score: float
    review_count: int
    cat_care_score: float | None = None
    pet_friendly_score: float | None = None
    driving_stability_score: float | None = None
    punctuality_score: float | None = None
    cleanliness_score: float | None = None
    communication_score: float | None = None
    feedback_completeness_score: float | None = None
    medication_accuracy_score: float | None = None
    top_tags: list[TagSummaryDTO] = Field(default_factory=list)


class ReviewCreateRequest(BaseModel):
    reviewer_user_id: UUID
    reviewee_user_id: UUID
    overall_score: float = Field(ge=0, le=5)
    cat_care_score: float | None = Field(default=None, ge=0, le=5)
    pet_friendly_score: float | None = Field(default=None, ge=0, le=5)
    driving_stability_score: float | None = Field(default=None, ge=0, le=5)
    punctuality_score: float | None = Field(default=None, ge=0, le=5)
    cleanliness_score: float | None = Field(default=None, ge=0, le=5)
    communication_score: float | None = Field(default=None, ge=0, le=5)
    feedback_completeness_score: float | None = Field(default=None, ge=0, le=5)
    medication_accuracy_score: float | None = Field(default=None, ge=0, le=5)
    supports_pet_handling_score: float | None = Field(default=None, ge=0, le=5)
    tags: list[str] = Field(default_factory=list)
    content: str | None = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    reviewer_user_id: UUID
    reviewee_user_id: UUID
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
    tags: list[str]
    content: str | None = None
    created_at: datetime


class ReviewListResponse(BaseModel):
    items: list[ReviewResponse]


class ServiceFeedbackCreateRequest(BaseModel):
    operator_user_id: UUID
    provider_user_id: UUID | None = None
    arrived_at: datetime | None = None
    left_at: datetime | None = None
    note: str | None = None
    photo_urls: list[str] = Field(default_factory=list)
    video_urls: list[str] = Field(default_factory=list)


class ServiceFeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    provider_user_id: UUID
    arrived_at: datetime | None = None
    left_at: datetime | None = None
    note: str | None = None
    photo_urls: list[str]
    video_urls: list[str]
    created_at: datetime


class ServiceFeedbackListResponse(BaseModel):
    items: list[ServiceFeedbackResponse]
