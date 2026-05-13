from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.marketplace import OrderResponse
from app.schemas.payments import RefundResponse
from app.schemas.profile import ProviderApplicationResponse


class PolicyFavoriteCreateRequest(BaseModel):
    user_id: UUID
    policy_id: str = Field(min_length=1, max_length=128)
    title: str = Field(min_length=1, max_length=256)
    district: str | None = Field(default=None, max_length=64)


class PolicyFavoriteDeleteRequest(BaseModel):
    user_id: UUID


class PolicyFavoriteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    policy_id: str
    title: str
    district: str | None = None
    created_at: datetime


class PolicyFavoriteListResponse(BaseModel):
    items: list[PolicyFavoriteResponse]


class ComplaintCreateRequest(BaseModel):
    complainant_user_id: UUID
    category: str = Field(min_length=1, max_length=64)
    content: str = Field(min_length=1)
    order_id: UUID | None = None
    target_user_id: UUID | None = None
    evidence_urls: list[str] = Field(default_factory=list)


class ComplaintHandleRequest(BaseModel):
    admin_user_id: UUID
    status: str = Field(min_length=1, max_length=32)
    resolution: str = Field(min_length=1)


class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID | None = None
    complainant_user_id: UUID
    target_user_id: UUID | None = None
    category: str
    content: str
    evidence_urls: list[str]
    status: str
    resolution: str | None = None
    handled_by: UUID | None = None
    created_at: datetime
    updated_at: datetime


class ComplaintListResponse(BaseModel):
    items: list[ComplaintResponse]


class DisputeCreateRequest(BaseModel):
    order_id: UUID
    opener_user_id: UUID
    reason: str = Field(min_length=1, max_length=128)
    description: str = Field(min_length=1)
    respondent_user_id: UUID | None = None
    requested_refund_fen: int | None = Field(default=None, ge=0)
    evidence_urls: list[str] = Field(default_factory=list)


class DisputeHandleRequest(BaseModel):
    admin_user_id: UUID
    status: str = Field(min_length=1, max_length=32)
    resolution: str = Field(min_length=1)


class DisputeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    opener_user_id: UUID
    respondent_user_id: UUID | None = None
    reason: str
    description: str
    requested_refund_fen: int | None = None
    evidence_urls: list[str]
    status: str
    resolution: str | None = None
    handled_by: UUID | None = None
    created_at: datetime
    updated_at: datetime


class DisputeListResponse(BaseModel):
    items: list[DisputeResponse]


class ReviewProviderApplicationRequest(BaseModel):
    admin_user_id: UUID
    status: str
    review_note: str | None = None


class ReviewProviderApplicationResponse(BaseModel):
    application: ProviderApplicationResponse


class AdminAuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    admin_user_id: UUID
    action: str
    target_type: str
    target_id: str
    payload: dict | None = None
    created_at: datetime


class AdminDashboardResponse(BaseModel):
    provider_applications: list[ProviderApplicationResponse]
    complaints: list[ComplaintResponse]
    disputes: list[DisputeResponse]
    orders: list[OrderResponse]
    refunds: list[RefundResponse]
    audit_logs: list[AdminAuditLogResponse]
