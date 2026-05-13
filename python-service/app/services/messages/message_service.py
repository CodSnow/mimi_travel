import uuid
from dataclasses import dataclass
from typing import Any

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.message_read import MessageRead
from app.repositories.message_repo import MessageRepository


class MessageServiceError(ValueError):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class ConversationDetail:
    conversation: Conversation
    messages: list[Message]
    read: MessageRead | None = None


class MessageService:
    def __init__(self, repo: MessageRepository) -> None:
        self.repo = repo

    def ensure_order_conversation(self, order_id: uuid.UUID) -> Conversation:
        order = self.repo.get_order(order_id)
        if order is None:
            raise MessageServiceError("order not found", status_code=404)
        return self.repo.ensure_conversation(
            demand_id=order.demand_id,
            order_id=order.id,
            participant_user_ids=[str(order.buyer_user_id), str(order.seller_user_id)],
        )

    def list_conversations(self, user_id: uuid.UUID) -> list[Conversation]:
        return self.repo.list_conversations_for_user(user_id)

    def get_conversation(self, conversation_id: uuid.UUID, operator_user_id: uuid.UUID) -> ConversationDetail:
        conversation = self._get_conversation(conversation_id)
        self._ensure_access(conversation, operator_user_id)
        return ConversationDetail(
            conversation=conversation,
            messages=self.repo.list_messages(conversation.id),
            read=self.repo.get_read(conversation.id, operator_user_id),
        )

    def send_message(
        self,
        conversation_id: uuid.UUID,
        sender_user_id: uuid.UUID,
        content: str,
        message_type: str = "text",
        payload: dict[str, Any] | None = None,
        related_demand_id: uuid.UUID | None = None,
        related_order_id: uuid.UUID | None = None,
        client_msg_id: str | None = None,
    ) -> Message:
        conversation = self._get_conversation(conversation_id)
        self._ensure_access(conversation, sender_user_id)
        if not content.strip():
            raise MessageServiceError("message content is required", status_code=422)
        return self.repo.create_message(
            conversation=conversation,
            sender_user_id=sender_user_id,
            message_type=message_type,
            content=content,
            payload=payload,
            related_demand_id=related_demand_id or conversation.demand_id,
            related_order_id=related_order_id or conversation.order_id,
            client_msg_id=client_msg_id,
        )

    def send_order_message(
        self,
        order_id: uuid.UUID,
        sender_user_id: uuid.UUID,
        content: str,
        message_type: str = "system",
        payload: dict[str, Any] | None = None,
    ) -> Message:
        conversation = self.ensure_order_conversation(order_id)
        return self.send_message(
            conversation.id,
            sender_user_id=sender_user_id,
            content=content,
            message_type=message_type,
            payload=payload,
            related_order_id=order_id,
        )

    def mark_read(
        self,
        conversation_id: uuid.UUID,
        user_id: uuid.UUID,
        last_read_message_id: uuid.UUID | None = None,
    ) -> MessageRead:
        conversation = self._get_conversation(conversation_id)
        self._ensure_access(conversation, user_id)
        return self.repo.mark_read(conversation.id, user_id, last_read_message_id)

    def _get_conversation(self, conversation_id: uuid.UUID) -> Conversation:
        conversation = self.repo.get_conversation(conversation_id)
        if conversation is None:
            raise MessageServiceError("conversation not found", status_code=404)
        return conversation

    def _ensure_access(self, conversation: Conversation, user_id: uuid.UUID) -> None:
        if str(user_id) not in conversation.participant_user_ids:
            raise MessageServiceError("conversation access denied", status_code=403)
