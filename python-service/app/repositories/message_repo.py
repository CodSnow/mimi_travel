import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.message_read import MessageRead
from app.models.order import Order


class MessageRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_order(self, order_id: uuid.UUID) -> Order | None:
        return self.db.get(Order, order_id)

    def get_conversation(self, conversation_id: uuid.UUID) -> Conversation | None:
        return self.db.get(Conversation, conversation_id)

    def find_order_conversation(self, order_id: uuid.UUID) -> Conversation | None:
        return self.db.execute(select(Conversation).where(Conversation.order_id == order_id)).scalar_one_or_none()

    def ensure_conversation(
        self,
        participant_user_ids: list[str],
        demand_id: uuid.UUID | None = None,
        order_id: uuid.UUID | None = None,
    ) -> Conversation:
        conversation = None
        if order_id is not None:
            conversation = self.find_order_conversation(order_id)
        if conversation is None and demand_id is not None:
            conversation = self.db.execute(
                select(Conversation).where(
                    Conversation.demand_id == demand_id,
                    Conversation.order_id.is_(None) if order_id is None else Conversation.order_id == order_id,
                )
            ).scalar_one_or_none()
        if conversation is not None:
            return conversation

        conversation = Conversation(
            demand_id=demand_id,
            order_id=order_id,
            participant_user_ids=participant_user_ids,
        )
        self.db.add(conversation)
        self.db.flush()
        self.db.refresh(conversation)
        return conversation

    def list_conversations_for_user(self, user_id: uuid.UUID) -> list[Conversation]:
        user_id_text = str(user_id)
        stmt = select(Conversation).order_by(desc(Conversation.last_message_at), desc(Conversation.created_at))
        return [
            conversation
            for conversation in self.db.execute(stmt).scalars().all()
            if user_id_text in conversation.participant_user_ids
        ]

    def create_message(
        self,
        conversation: Conversation,
        sender_user_id: uuid.UUID,
        message_type: str,
        content: str,
        payload: dict[str, Any] | None = None,
        related_demand_id: uuid.UUID | None = None,
        related_order_id: uuid.UUID | None = None,
        client_msg_id: str | None = None,
    ) -> Message:
        message = Message(
            conversation_id=conversation.id,
            sender_user_id=sender_user_id,
            type=message_type,
            content=content,
            payload=payload,
            related_demand_id=related_demand_id,
            related_order_id=related_order_id,
            client_msg_id=client_msg_id,
        )
        conversation.last_message_at = datetime.now(UTC)
        self.db.add(message)
        self.db.flush()
        self.db.refresh(message)
        self.db.refresh(conversation)
        return message

    def list_messages(self, conversation_id: uuid.UUID, limit: int = 50) -> list[Message]:
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(desc(Message.created_at), desc(Message.id))
            .limit(limit)
        )
        return list(reversed(self.db.execute(stmt).scalars().all()))

    def mark_read(
        self,
        conversation_id: uuid.UUID,
        user_id: uuid.UUID,
        last_read_message_id: uuid.UUID | None = None,
    ) -> MessageRead:
        read = self.db.execute(
            select(MessageRead).where(
                MessageRead.conversation_id == conversation_id,
                MessageRead.user_id == user_id,
            )
        ).scalar_one_or_none()
        if read is None:
            read = MessageRead(
                conversation_id=conversation_id,
                user_id=user_id,
                last_read_message_id=last_read_message_id,
                read_at=datetime.now(UTC),
            )
            self.db.add(read)
        else:
            read.last_read_message_id = last_read_message_id or read.last_read_message_id
            read.read_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(read)
        return read

    def get_read(self, conversation_id: uuid.UUID, user_id: uuid.UUID) -> MessageRead | None:
        return self.db.execute(
            select(MessageRead).where(
                MessageRead.conversation_id == conversation_id,
                MessageRead.user_id == user_id,
            )
        ).scalar_one_or_none()
