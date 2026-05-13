from fastapi import APIRouter

from app.api.internal.matching import router as matching_router
from app.api.internal.orders import router as orders_router
from app.api.internal.pricing import router as pricing_router
from app.api.internal.reviews import router as reviews_router
from app.api.internal.risk import router as risk_router


api_router = APIRouter()
api_router.include_router(matching_router, prefix="/internal/matching", tags=["matching"])
api_router.include_router(reviews_router, prefix="/internal/reviews", tags=["reviews"])
api_router.include_router(pricing_router, prefix="/internal/pricing", tags=["pricing"])
api_router.include_router(risk_router, prefix="/internal/risk", tags=["risk"])
api_router.include_router(orders_router, prefix="/internal/orders", tags=["orders"])

