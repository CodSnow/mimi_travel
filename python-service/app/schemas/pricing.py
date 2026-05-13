from typing import Any

from pydantic import BaseModel

from app.schemas.common import InternalRequestMeta


class PricingDemandDTO(BaseModel):
    service_type: str
    district: str | None = None
    budget_min: int | None = None
    budget_max: int | None = None
    care_requirements: dict[str, Any] | None = None
    ride_requirements: dict[str, Any] | None = None


class PricingProviderDTO(BaseModel):
    provider_user_id: str
    vehicle_id: str | None = None


class PricingQuoteRequest(BaseModel):
    meta: InternalRequestMeta
    demand: PricingDemandDTO
    provider: PricingProviderDTO | None = None


class PricingBreakdownDTO(BaseModel):
    code: str
    label: str
    amount_fen: int


class PricingQuoteResponse(BaseModel):
    request_id: str
    amount_fen: int
    breakdown: list[PricingBreakdownDTO]
