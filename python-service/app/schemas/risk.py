from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import InternalRequestMeta


class PrepayRiskOrderDTO(BaseModel):
    id: str
    buyer_user_id: str
    seller_user_id: str
    amount_fen: int
    service_type: str
    district: str | None = None


class PrepayRiskPaymentDTO(BaseModel):
    channel: Literal["alipay", "wechat_pay"]
    scene: Literal["deposit", "full", "balance"]


class PrepayRiskCheckRequest(BaseModel):
    meta: InternalRequestMeta
    order: PrepayRiskOrderDTO
    payment: PrepayRiskPaymentDTO


class PrepayRiskCheckResponse(BaseModel):
    request_id: str
    allowed: bool
    risk_level: Literal["low", "medium", "high"]
    reason_codes: list[str] = Field(default_factory=list)
    human_message: str | None = None
