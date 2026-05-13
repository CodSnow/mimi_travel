import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin


class LocationSnapshot(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "location_snapshots"
    __table_args__ = (
        Index("idx_location_snapshots_order_id", "order_id"),
        Index("idx_location_snapshots_user_id", "user_id"),
    )

    order_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    lat: Mapped[float] = mapped_column(Numeric(10, 7), nullable=False)
    lng: Mapped[float] = mapped_column(Numeric(10, 7), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    coord_system: Mapped[str] = mapped_column(String(16), nullable=False, default="gcj02")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
