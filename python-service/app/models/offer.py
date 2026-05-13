import uuid

from sqlalchemy import BigInteger, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Offer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "offers"
    __table_args__ = (
        Index("idx_offers_demand_id", "demand_id"),
        Index("idx_offers_provider_user_id", "provider_user_id"),
    )

    demand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("demands.id"), nullable=False)
    provider_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    quote_amount_fen: Mapped[int] = mapped_column(BigInteger, nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    eta_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicle_profiles.id"), nullable=True
    )
    service_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="submitted")

