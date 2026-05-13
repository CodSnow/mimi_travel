from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.repositories.provider_repo import ProviderRepository
from app.schemas.order import OrderSnapshotRequest, OrderSnapshotResponse
from app.services.orders.snapshot_service import SnapshotService
from app.services.profiles.provider_profile_service import ProviderProfileService
from app.services.profiles.vehicle_profile_service import VehicleProfileService


router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/snapshot", response_model=OrderSnapshotResponse)
def order_snapshot(
    payload: OrderSnapshotRequest,
    db: Session = Depends(get_db),
) -> OrderSnapshotResponse:
    service = SnapshotService(
        ProviderRepository(db),
        ProviderProfileService(),
        VehicleProfileService(),
    )
    return service.build_snapshot(payload)
