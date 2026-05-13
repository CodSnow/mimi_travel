from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PaymentCreateRequest(BaseModel):
    order_id: UUID
    operator_user_id: UUID
    channel: str = Field(min_length=1, max_length=32)
    scene: str = Field(min_length=1, max_length=32)
    amount_fen: int | None = Field(default=None, gt=0)
    idempotency_key: str | None = Field(default=None, max_length=128)


class PaymentQueryRequest(BaseModel):
    operator_user_id: UUID
    mark_paid: bool = False
    provider_trade_no: str | None = None
    raw_payload: dict[str, Any] | None = None


class PaymentNotifyRequest(BaseModel):
    out_trade_no: str
    provider_trade_no: str | None = None
    raw_payload: dict[str, Any] = Field(default_factory=dict)


class PaymentCloseRequest(BaseModel):
    operator_user_id: UUID


class RefundCreateRequest(BaseModel):
    operator_user_id: UUID
    reason: str | None = None
    refund_amount_fen: int | None = Field(default=None, gt=0)


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    channel: str
    scene: str
    amount_fen: int
    currency: str
    status: str
    out_trade_no: str
    idempotency_key: str | None = None
    provider_trade_no: str | None = None
    query_count: int
    event_summary: dict[str, Any] | None = None
    channel_payload: dict[str, Any] | None = None
    paid_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class PaymentCreateResponse(BaseModel):
    payment: PaymentResponse
    channel_payload: dict[str, Any]


class RefundResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    payment_id: UUID
    order_id: UUID
    refund_amount_fen: int
    status: str
    provider_refund_no: str | None = None
    reason: str | None = None
    created_at: datetime
    updated_at: datetime


class RefundCreateResponse(BaseModel):
    payment: PaymentResponse
    refund: RefundResponse
