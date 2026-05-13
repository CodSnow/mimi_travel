import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin


class RecommendationSnapshot(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "recommendation_snapshots"
    __table_args__ = (Index("idx_recommendation_snapshots_demand_id", "demand_id"),)

    demand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("demands.id"), nullable=False)
    recommendation_type: Mapped[str] = mapped_column(String(32), nullable=False)
    candidate_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    score: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False)
    reason_codes: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
