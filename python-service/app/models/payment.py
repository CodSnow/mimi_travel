import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Payment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (Index("idx_payments_order_id", "order_id"), Index("idx_payments_status", "status"))

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    scene: Mapped[str] = mapped_column(String(32), nullable=False)
    amount_fen: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="CNY")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="created")
    out_trade_no: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    provider_trade_no: Mapped[str | None] = mapped_column(String(128), nullable=True)
    raw_notify: Mapped[str | None] = mapped_column(Text, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

