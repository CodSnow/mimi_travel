import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ProviderProfile(TimestampMixin, Base):
    __tablename__ = "provider_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    services: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    intro: Mapped[str | None] = mapped_column(Text, nullable=True)
    service_radius_km: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    base_district: Mapped[str | None] = mapped_column(String(64), nullable=True)
    score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    completed_order_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cat_care_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    communication_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    punctuality_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    emergency_handling_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    pet_friendly_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    driving_stability_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    cleanliness_score: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    supports_home_visit: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    supports_medication: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    supports_multi_day_care: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    supports_emergency_order: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    cat_care_tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

