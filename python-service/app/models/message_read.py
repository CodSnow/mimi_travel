import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin


class MessageRead(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "message_reads"
    __table_args__ = (
        Index("idx_message_reads_conversation_id", "conversation_id"),
        UniqueConstraint("conversation_id", "user_id", name="uq_message_reads_conversation_user"),
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    last_read_message_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True
    )
    read_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
