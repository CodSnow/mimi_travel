from app.repositories.review_repo import ReviewRepository
from app.services.reviews.tags_aggregation_service import TagsAggregationService
from app.schemas.reviews import ProviderReviewSummaryResponse


def _average(values: list[float | None]) -> float | None:
    present = [value for value in values if value is not None]
    if not present:
        return None
    return round(sum(present) / len(present), 2)


class ProviderReviewSummaryService:
    def __init__(
        self,
        review_repo: ReviewRepository,
        tags_service: TagsAggregationService,
    ) -> None:
        self.review_repo = review_repo
        self.tags_service = tags_service

    def summarize(self, request_id: str, provider_user_id: str) -> ProviderReviewSummaryResponse:
        reviews = self.review_repo.list_reviews_for_provider(provider_user_id)
        feedbacks = self.review_repo.list_feedbacks_for_provider(provider_user_id)

        media_scores = [
            min(5.0, 3.0 + len(item.photo_urls) * 0.6 + len(item.video_urls) * 1.2)
            for item in feedbacks
        ]
        feedback_score = _average([*media_scores, *[review.feedback_completeness_score for review in reviews]])

        return ProviderReviewSummaryResponse(
            request_id=request_id,
            provider_user_id=provider_user_id,
            overall_score=_average([review.overall_score for review in reviews]) or 0.0,
            review_count=len(reviews),
            cat_care_score=_average([review.cat_care_score for review in reviews]),
            pet_friendly_score=_average([review.pet_friendly_score for review in reviews]),
            driving_stability_score=_average([review.driving_stability_score for review in reviews]),
            punctuality_score=_average([review.punctuality_score for review in reviews]),
            cleanliness_score=_average([review.cleanliness_score for review in reviews]),
            communication_score=_average([review.communication_score for review in reviews]),
            feedback_completeness_score=round(feedback_score, 2) if feedback_score is not None else None,
            medication_accuracy_score=_average([review.medication_accuracy_score for review in reviews]),
            top_tags=self.tags_service.top_tags(reviews),
        )
