from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    demand_id: UUID | None = None
    order_id: UUID | None = None
    participant_user_ids: list[str]
    last_message_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    sender_user_id: UUID
    type: str
    content: str
    payload: dict[str, Any] | None = None
    client_msg_id: str | None = None
    related_demand_id: UUID | None = None
    related_order_id: UUID | None = None
    created_at: datetime


class MessageReadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    user_id: UUID
    last_read_message_id: UUID | None = None
    read_at: datetime


class ConversationListResponse(BaseModel):
    items: list[ConversationResponse]


class ConversationDetailResponse(BaseModel):
    conversation: ConversationResponse
    messages: list[MessageResponse]
    read: MessageReadResponse | None = None


class EnsureOrderConversationRequest(BaseModel):
    order_id: UUID


class SendMessageRequest(BaseModel):
    sender_user_id: UUID
    type: str = "text"
    content: str = Field(min_length=1)
    payload: dict[str, Any] | None = None
    related_demand_id: UUID | None = None
    related_order_id: UUID | None = None
    client_msg_id: str | None = Field(default=None, max_length=128)


class MarkReadRequest(BaseModel):
    conversation_id: UUID
    user_id: UUID
    last_read_message_id: UUID | None = None
