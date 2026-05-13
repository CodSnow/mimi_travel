from fastapi import APIRouter, Depends

from app.api.deps import verify_internal_token
from app.schemas.pricing import PricingQuoteRequest, PricingQuoteResponse
from app.services.pricing.quote_service import QuoteService


router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/quote", response_model=PricingQuoteResponse)
def quote(payload: PricingQuoteRequest) -> PricingQuoteResponse:
    return QuoteService().quote(payload)
