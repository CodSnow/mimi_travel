import uuid

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Pet(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "pets"
    __table_args__ = (Index("idx_pets_user_id", "user_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    breed: Mapped[str | None] = mapped_column(String(64), nullable=True)
    weight: Mapped[str | None] = mapped_column(String(32), nullable=True)
    vaccine: Mapped[str | None] = mapped_column(String(128), nullable=True)
    certificate: Mapped[str | None] = mapped_column(String(128), nullable=True)
    avatar: Mapped[str | None] = mapped_column(String, nullable=True)

