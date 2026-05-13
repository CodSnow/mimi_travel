from collections import Counter

from app.repositories.projections import ReviewProjection
from app.schemas.reviews import TagSummaryDTO


class TagsAggregationService:
    def top_tags(self, reviews: list[ReviewProjection], limit: int = 5) -> list[TagSummaryDTO]:
        counter = Counter(tag for review in reviews for tag in review.tags)
        return [TagSummaryDTO(tag=tag, count=count) for tag, count in counter.most_common(limit)]
