from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class InternalRequestMeta(BaseModel):
    request_id: str
    trace_id: str | None = None
    operator_user_id: str | None = None
    source: Literal["ts-bff"]
    timestamp: datetime

