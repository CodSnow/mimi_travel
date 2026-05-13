from pydantic import BaseModel, Field

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
