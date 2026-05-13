from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LocationReportRequest(BaseModel):
    user_id: UUID
    order_id: UUID | None = None
    lat: float
    lng: float
    address: str | None = None
    coord_system: str = Field(default="gcj02", max_length=16)


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID | None = None
    user_id: UUID | None = None
    lat: float
    lng: float
    address: str | None = None
    coord_system: str
    created_at: datetime


class LocationReportResponse(BaseModel):
    snapshot: LocationResponse
    message_id: UUID | None = None


class LocationListResponse(BaseModel):
    items: list[LocationResponse]
