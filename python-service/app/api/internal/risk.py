from fastapi import APIRouter, Depends

from app.api.deps import verify_internal_token
from app.schemas.risk import PrepayRiskCheckRequest, PrepayRiskCheckResponse
from app.services.risk.prepay_check_service import PrepayCheckService


router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/prepay-check", response_model=PrepayRiskCheckResponse)
def prepay_check(payload: PrepayRiskCheckRequest) -> PrepayRiskCheckResponse:
    return PrepayCheckService().check(payload)
