from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.repositories.location_repo import LocationRepository
from app.repositories.message_repo import MessageRepository
from app.schemas.locations import LocationListResponse, LocationReportRequest, LocationReportResponse, LocationResponse
from app.services.locations.location_service import LocationService, LocationServiceError


router = APIRouter(dependencies=[Depends(verify_internal_token)])


def _service(db: Session) -> LocationService:
    return LocationService(LocationRepository(db), MessageRepository(db))


def _raise_http(error: LocationServiceError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error))


@router.post("/report", response_model=LocationReportResponse)
def report_location(
    payload: LocationReportRequest,
    db: Session = Depends(get_db),
) -> LocationReportResponse:
    try:
        result = _service(db).report_location(**payload.model_dump())
        db.commit()
        return LocationReportResponse(
            snapshot=LocationResponse.model_validate(result.snapshot),
            message_id=result.message_id,
        )
    except LocationServiceError as error:
        db.rollback()
        _raise_http(error)


@router.get("/orders/{order_id}", response_model=LocationListResponse)
def list_order_locations(
    order_id: UUID,
    operator_user_id: UUID,
    limit: int = 20,
    db: Session = Depends(get_db),
) -> LocationListResponse:
    try:
        locations = _service(db).list_order_locations(order_id, operator_user_id, limit=limit)
        return LocationListResponse(items=[LocationResponse.model_validate(item) for item in locations])
    except LocationServiceError as error:
        _raise_http(error)
