import uuid

from sqlalchemy import BigInteger, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Dispute(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "disputes"
    __table_args__ = (
        Index("idx_disputes_order_id", "order_id"),
        Index("idx_disputes_status", "status"),
    )

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    opener_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    respondent_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reason: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requested_refund_fen: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    evidence_urls: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    handled_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
