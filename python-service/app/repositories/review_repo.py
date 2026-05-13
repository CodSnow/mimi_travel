from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.seed import load_sample_feedbacks, load_sample_reviews
from app.models.review import Review
from app.models.service_feedback import ServiceFeedback
from app.repositories.projections import ReviewProjection, ServiceFeedbackProjection


def _to_float(value: Decimal | float | None) -> float | None:
    if value is None:
        return None
    return float(value)


def _safe_uuid(value: str) -> UUID | None:
    try:
        return UUID(value)
    except ValueError:
        return None


class ReviewRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_reviews_for_provider(self, provider_user_id: str) -> list[ReviewProjection]:
        target_id = _safe_uuid(provider_user_id)
        try:
            if target_id is not None:
                reviews = self._list_reviews_from_db(target_id)
                if reviews:
                    return reviews
        except SQLAlchemyError:
            pass

        return [review for review in load_sample_reviews() if review.reviewee_user_id == provider_user_id]

    def list_feedbacks_for_provider(self, provider_user_id: str) -> list[ServiceFeedbackProjection]:
        target_id = _safe_uuid(provider_user_id)
        try:
            if target_id is not None:
                feedbacks = self._list_feedbacks_from_db(target_id)
                if feedbacks:
                    return feedbacks
        except SQLAlchemyError:
            pass

        return [
            feedback
            for feedback in load_sample_feedbacks()
            if feedback.provider_user_id == provider_user_id
        ]

    def _list_reviews_from_db(self, provider_user_id: UUID) -> list[ReviewProjection]:
        rows = self.db.execute(
            select(Review).where(Review.reviewee_user_id == provider_user_id)
        ).scalars().all()
        return [
            ReviewProjection(
                reviewee_user_id=str(row.reviewee_user_id),
                overall_score=_to_float(row.overall_score) or 0.0,
                cat_care_score=_to_float(row.cat_care_score),
                pet_friendly_score=_to_float(row.pet_friendly_score),
                driving_stability_score=_to_float(row.driving_stability_score),
                punctuality_score=_to_float(row.punctuality_score),
                cleanliness_score=_to_float(row.cleanliness_score),
                communication_score=_to_float(row.communication_score),
                feedback_completeness_score=_to_float(row.feedback_completeness_score),
                medication_accuracy_score=_to_float(row.medication_accuracy_score),
                supports_pet_handling_score=_to_float(row.supports_pet_handling_score),
                tags=list(row.tags or []),
                created_at=row.created_at,
            )
            for row in rows
        ]

    def _list_feedbacks_from_db(self, provider_user_id: UUID) -> list[ServiceFeedbackProjection]:
        rows = self.db.execute(
            select(ServiceFeedback).where(ServiceFeedback.provider_user_id == provider_user_id)
        ).scalars().all()
        return [
            ServiceFeedbackProjection(
                order_id=str(row.order_id),
                provider_user_id=str(row.provider_user_id),
                photo_urls=list(row.photo_urls or []),
                video_urls=list(row.video_urls or []),
                created_at=row.created_at,
            )
            for row in rows
        ]
