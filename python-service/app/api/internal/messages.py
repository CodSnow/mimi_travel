from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.repositories.message_repo import MessageRepository
from app.schemas.messages import (
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationResponse,
    EnsureOrderConversationRequest,
    MarkReadRequest,
    MessageReadResponse,
    MessageResponse,
    SendMessageRequest,
)
from app.services.messages.message_service import MessageService, MessageServiceError


router = APIRouter(dependencies=[Depends(verify_internal_token)])


def _service(db: Session) -> MessageService:
    return MessageService(MessageRepository(db))


def _raise_http(error: MessageServiceError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error))


@router.get("/conversations", response_model=ConversationListResponse)
def list_conversations(user_id: UUID, db: Session = Depends(get_db)) -> ConversationListResponse:
    conversations = _service(db).list_conversations(user_id)
    return ConversationListResponse(items=[ConversationResponse.model_validate(item) for item in conversations])


@router.post("/conversations/ensure-order", response_model=ConversationResponse)
def ensure_order_conversation(
    payload: EnsureOrderConversationRequest,
    db: Session = Depends(get_db),
) -> ConversationResponse:
    try:
        conversation = _service(db).ensure_order_conversation(payload.order_id)
        db.commit()
        return ConversationResponse.model_validate(conversation)
    except MessageServiceError as error:
        db.rollback()
        _raise_http(error)


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: UUID,
    operator_user_id: UUID,
    db: Session = Depends(get_db),
) -> ConversationDetailResponse:
    try:
        detail = _service(db).get_conversation(conversation_id, operator_user_id)
        return ConversationDetailResponse(
            conversation=ConversationResponse.model_validate(detail.conversation),
            messages=[MessageResponse.model_validate(item) for item in detail.messages],
            read=MessageReadResponse.model_validate(detail.read) if detail.read else None,
        )
    except MessageServiceError as error:
        _raise_http(error)


@router.post("/conversations/{conversation_id}", response_model=MessageResponse)
def send_message(
    conversation_id: UUID,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    try:
        message = _service(db).send_message(conversation_id=conversation_id, **payload.model_dump())
        db.commit()
        return MessageResponse.model_validate(message)
    except MessageServiceError as error:
        db.rollback()
        _raise_http(error)


@router.post("/read", response_model=MessageReadResponse)
def mark_read(payload: MarkReadRequest, db: Session = Depends(get_db)) -> MessageReadResponse:
    try:
        read = _service(db).mark_read(**payload.model_dump())
        db.commit()
        return MessageReadResponse.model_validate(read)
    except MessageServiceError as error:
        db.rollback()
        _raise_http(error)
