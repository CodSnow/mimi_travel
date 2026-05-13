import uuid

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class VehicleProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "vehicle_profiles"
    __table_args__ = (Index("idx_vehicle_profiles_user_id", "user_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(32), nullable=False)
    plate_masked: Mapped[str] = mapped_column(String(32), nullable=False)
    seats: Mapped[int] = mapped_column(Integer, nullable=False)
    trunk_level: Mapped[str | None] = mapped_column(String(16), nullable=True)
    supports_cat_bag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    supports_crate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    supports_stroller: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    supports_multi_pet: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pet_friendly: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pet_friendly_tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

