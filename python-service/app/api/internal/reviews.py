from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.repositories.review_repo import ReviewRepository
from app.schemas.reviews import ProviderReviewSummaryRequest, ProviderReviewSummaryResponse
from app.services.reviews.provider_review_summary_service import ProviderReviewSummaryService
from app.services.reviews.tags_aggregation_service import TagsAggregationService


router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/provider-summary", response_model=ProviderReviewSummaryResponse)
def provider_summary(
    payload: ProviderReviewSummaryRequest,
    db: Session = Depends(get_db),
) -> ProviderReviewSummaryResponse:
    service = ProviderReviewSummaryService(ReviewRepository(db), TagsAggregationService())
    return service.summarize(payload.meta.request_id, payload.provider_user_id)
