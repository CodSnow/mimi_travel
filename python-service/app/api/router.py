from fastapi import APIRouter

from app.api.internal import governance, identity, locations, marketplace, messages, payments, profiles
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
api_router.include_router(identity.router, prefix="/internal/identity", tags=["internal-identity"])
api_router.include_router(marketplace.router, prefix="/internal/marketplace", tags=["internal-marketplace"])
api_router.include_router(payments.router, prefix="/internal/payments", tags=["internal-payments"])
api_router.include_router(messages.router, prefix="/internal/messages", tags=["internal-messages"])
api_router.include_router(locations.router, prefix="/internal/locations", tags=["internal-locations"])
api_router.include_router(profiles.router, prefix="/internal/profiles", tags=["internal-profiles"])
api_router.include_router(governance.router, prefix="/internal/governance", tags=["internal-governance"])
