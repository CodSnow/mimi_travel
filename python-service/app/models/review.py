import uuid

from sqlalchemy import ForeignKey, Index, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin


class Review(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "reviews"
    __table_args__ = (
        Index("idx_reviews_reviewee_user_id", "reviewee_user_id"),
        Index("idx_reviews_order_id", "order_id"),
    )

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    reviewer_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    reviewee_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    overall_score: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    cat_care_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    pet_friendly_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    driving_stability_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    punctuality_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    cleanliness_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    communication_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    feedback_completeness_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    medication_accuracy_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    supports_pet_handling_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)

