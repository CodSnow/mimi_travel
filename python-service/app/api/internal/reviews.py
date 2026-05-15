from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.models.order import Order
from app.models.user import User
from app.repositories.review_repo import ReviewRepository
from app.schemas.reviews import (
    ProviderReviewSummaryRequest,
    ProviderReviewSummaryResponse,
    ReviewCreateRequest,
    ReviewListResponse,
    ReviewResponse,
    ServiceFeedbackCreateRequest,
    ServiceFeedbackListResponse,
    ServiceFeedbackResponse,
)
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


def _require_order(db: Session, order_id: UUID) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="order not found")
    return order


def _require_user(db: Session, user_id: UUID) -> None:
    if db.get(User, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")


@router.post("/orders/{order_id}/reviews", response_model=ReviewResponse)
def create_order_review(
    order_id: UUID,
    payload: ReviewCreateRequest,
    db: Session = Depends(get_db),
) -> ReviewResponse:
    order = _require_order(db, order_id)
    _require_user(db, payload.reviewer_user_id)
    _require_user(db, payload.reviewee_user_id)
    if payload.reviewer_user_id == payload.reviewee_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="reviewee must be the other participant of the order")
    expected_reviewee_user_id = (
        order.seller_user_id
        if payload.reviewer_user_id == order.buyer_user_id
        else order.buyer_user_id
        if payload.reviewer_user_id == order.seller_user_id
        else None
    )
    if expected_reviewee_user_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="reviewer is not an order participant")
    if payload.reviewee_user_id != expected_reviewee_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="reviewee must be the other participant of the order")
    repo = ReviewRepository(db)
    if repo.get_review_for_order_reviewer(order.id, payload.reviewer_user_id) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="review already submitted for this order")
    try:
        review = repo.create_review(order_id=order.id, **payload.model_dump())
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="review already submitted for this order") from exc
    return ReviewResponse.model_validate(review)


@router.get("/providers/{provider_user_id}/reviews", response_model=ReviewListResponse)
def list_provider_reviews(
    provider_user_id: UUID,
    db: Session = Depends(get_db),
) -> ReviewListResponse:
    reviews = ReviewRepository(db).list_reviews(provider_user_id)
    return ReviewListResponse(items=[ReviewResponse.model_validate(review) for review in reviews])


@router.post("/orders/{order_id}/feedback", response_model=ServiceFeedbackResponse)
def create_order_feedback(
    order_id: UUID,
    payload: ServiceFeedbackCreateRequest,
    db: Session = Depends(get_db),
) -> ServiceFeedbackResponse:
    order = _require_order(db, order_id)
    _require_user(db, payload.operator_user_id)
    provider_user_id = payload.provider_user_id or payload.operator_user_id
    if payload.operator_user_id != order.seller_user_id or provider_user_id != order.seller_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="only order seller can submit feedback")
    feedback = ReviewRepository(db).create_feedback(
        order_id=order.id,
        provider_user_id=provider_user_id,
        arrived_at=payload.arrived_at,
        left_at=payload.left_at,
        note=payload.note,
        photo_urls=payload.photo_urls,
        video_urls=payload.video_urls,
    )
    db.commit()
    return ServiceFeedbackResponse.model_validate(feedback)


@router.get("/orders/{order_id}/feedback", response_model=ServiceFeedbackListResponse)
def list_order_feedback(
    order_id: UUID,
    db: Session = Depends(get_db),
) -> ServiceFeedbackListResponse:
    _require_order(db, order_id)
    feedbacks = ReviewRepository(db).list_feedbacks(order_id)
    return ServiceFeedbackListResponse(items=[ServiceFeedbackResponse.model_validate(feedback) for feedback in feedbacks])
