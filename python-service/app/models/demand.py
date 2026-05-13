import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Demand(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "demands"
    __table_args__ = (
        Index("idx_demands_user_id", "user_id"),
        Index("idx_demands_service_type", "service_type"),
        Index("idx_demands_status", "status"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    service_type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    pet_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    budget_min_fen: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    budget_max_fen: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    expected_price_fen: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    contact_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    allow_bargain: Mapped[bool] = mapped_column(nullable=False, default=False)
    visibility_radius_km: Mapped[int] = mapped_column(nullable=False, default=5)
    district: Mapped[str | None] = mapped_column(String(64), nullable=True)
    pickup: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    destination: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    care_requirements: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ride_requirements: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    service_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    selected_offer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

