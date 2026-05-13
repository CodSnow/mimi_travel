from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.repositories.provider_repo import ProviderRepository
from app.schemas.matching import (
    CaregiverMatchRequest,
    CaregiverMatchResponse,
    DriverMatchRequest,
    DriverMatchResponse,
)
from app.repositories.review_repo import ReviewRepository
from app.services.matching.caregiver_match_service import CaregiverMatchService
from app.services.matching.driver_match_service import DriverMatchService
from app.services.reviews.provider_review_summary_service import ProviderReviewSummaryService
from app.services.reviews.tags_aggregation_service import TagsAggregationService


router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/caregivers", response_model=CaregiverMatchResponse)
def match_caregivers(
    payload: CaregiverMatchRequest,
    db: Session = Depends(get_db),
) -> CaregiverMatchResponse:
    review_service = ProviderReviewSummaryService(ReviewRepository(db), TagsAggregationService())
    service = CaregiverMatchService(ProviderRepository(db), review_service)
    return service.match(payload)


@router.post("/drivers", response_model=DriverMatchResponse)
def match_drivers(
    payload: DriverMatchRequest,
    db: Session = Depends(get_db),
) -> DriverMatchResponse:
    review_service = ProviderReviewSummaryService(ReviewRepository(db), TagsAggregationService())
    service = DriverMatchService(ProviderRepository(db), review_service)
    return service.match(payload)
