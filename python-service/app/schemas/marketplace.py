from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DemandCreateRequest(BaseModel):
    user_id: UUID
    service_type: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=128)
    description: str | None = None
    pet_summary: str | None = None
    pet_ids: list[str] = Field(default_factory=list)
    pet_snapshot: dict[str, Any] | None = None
    budget_min_fen: int | None = None
    budget_max_fen: int | None = None
    expected_price_fen: int | None = None
    contact_name: str | None = Field(default=None, max_length=64)
    contact_phone: str | None = Field(default=None, max_length=32)
    allow_bargain: bool = False
    visibility_radius_km: int = 5
    district: str | None = Field(default=None, max_length=64)
    pickup: dict[str, Any] | None = None
    destination: dict[str, Any] | None = None
    care_requirements: dict[str, Any] | None = None
    ride_requirements: dict[str, Any] | None = None
    service_time: datetime | None = None


class DemandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    service_type: str
    title: str
    description: str | None = None
    pet_summary: str | None = None
    pet_ids: list[str] = Field(default_factory=list)
    pet_snapshot: dict[str, Any] | None = None
    budget_min_fen: int | None = None
    budget_max_fen: int | None = None
    expected_price_fen: int | None = None
    contact_name: str | None = None
    contact_phone: str | None = None
    allow_bargain: bool
    visibility_radius_km: int
    district: str | None = None
    pickup: dict[str, Any] | None = None
    destination: dict[str, Any] | None = None
    care_requirements: dict[str, Any] | None = None
    ride_requirements: dict[str, Any] | None = None
    service_time: datetime | None = None
    status: str
    selected_offer_id: UUID | None = None
    created_at: datetime
    updated_at: datetime


class DemandListResponse(BaseModel):
    items: list[DemandResponse]


class DemandCancelRequest(BaseModel):
    operator_user_id: UUID


class OfferCreateRequest(BaseModel):
    provider_user_id: UUID
    quote_amount_fen: int = Field(ge=0)
    message: str | None = None
    eta_minutes: int | None = Field(default=None, ge=0)
    vehicle_id: UUID | None = None
    service_plan: str | None = None


class OfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    demand_id: UUID
    provider_user_id: UUID
    quote_amount_fen: int
    message: str | None = None
    eta_minutes: int | None = None
    vehicle_id: UUID | None = None
    service_plan: str | None = None
    status: str
    created_at: datetime


class OfferListResponse(BaseModel):
    items: list[OfferResponse]


class AcceptOfferRequest(BaseModel):
    operator_user_id: UUID


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    demand_id: UUID
    buyer_user_id: UUID
    seller_user_id: UUID
    title: str
    amount_fen: int
    deposit_fen: int | None = None
    status: str
    service_time: datetime | None = None
    pickup: dict[str, Any] | None = None
    destination: dict[str, Any] | None = None
    pet_snapshot: dict[str, Any] | None = None
    vehicle_id: UUID | None = None
    driver_snapshot: dict[str, Any] | None = None
    caregiver_snapshot: dict[str, Any] | None = None
    payment_status: str
    refund_status: str
    feedback_summary: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime


class AcceptOfferResponse(BaseModel):
    offer: OfferResponse
    order: OrderResponse


class OrderEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    event_type: str
    operator_user_id: UUID | None = None
    payload: dict[str, Any] | None = None
    created_at: datetime


class OrderListResponse(BaseModel):
    items: list[OrderResponse]


class OrderDetailResponse(BaseModel):
    order: OrderResponse
    events: list[OrderEventResponse]


class OrderTransitionRequest(BaseModel):
    action: str
    operator_user_id: UUID
