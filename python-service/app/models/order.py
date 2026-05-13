import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Order(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("idx_orders_buyer_user_id", "buyer_user_id"),
        Index("idx_orders_seller_user_id", "seller_user_id"),
        Index("idx_orders_status", "status"),
    )

    demand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("demands.id"), nullable=False)
    buyer_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    seller_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(128), nullable=False)
    amount_fen: Mapped[int] = mapped_column(BigInteger, nullable=False)
    deposit_fen: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending_payment")
    service_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    pickup: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    destination: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    pet_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicle_profiles.id"), nullable=True
    )
    driver_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    caregiver_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    payment_status: Mapped[str] = mapped_column(String(32), nullable=False, default="unpaid")
    refund_status: Mapped[str] = mapped_column(String(32), nullable=False, default="none")
    feedback_summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
