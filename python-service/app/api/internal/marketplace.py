from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.repositories.marketplace_repo import MarketplaceRepository
from app.schemas.marketplace import (
    AcceptOfferRequest,
    AcceptOfferResponse,
    DemandCancelRequest,
    DemandCreateRequest,
    DemandListResponse,
    DemandResponse,
    OfferCreateRequest,
    OfferListResponse,
    OfferResponse,
    OrderDetailResponse,
    OrderEventResponse,
    OrderListResponse,
    OrderResponse,
    OrderTransitionRequest,
)
from app.services.marketplace.marketplace_service import MarketplaceService, MarketplaceServiceError
from app.services.orders.order_state_service import OrderStateService


router = APIRouter(dependencies=[Depends(verify_internal_token)])


def _service(db: Session) -> MarketplaceService:
    return MarketplaceService(MarketplaceRepository(db), OrderStateService())


def _raise_http(error: MarketplaceServiceError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error))


@router.post("/demands", response_model=DemandResponse)
def create_demand(
    payload: DemandCreateRequest,
    db: Session = Depends(get_db),
) -> DemandResponse:
    service = _service(db)
    try:
        demand = service.create_demand(**payload.model_dump())
        db.commit()
        return DemandResponse.model_validate(demand)
    except MarketplaceServiceError as error:
        db.rollback()
        _raise_http(error)


@router.get("/demands", response_model=DemandListResponse)
def list_demands(
    service_type: str | None = None,
    district: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
) -> DemandListResponse:
    demands = _service(db).list_demands(
        service_type=service_type,
        district=district,
        status=status,
        page=page,
        page_size=page_size,
    )
    return DemandListResponse(items=[DemandResponse.model_validate(demand) for demand in demands])


@router.get("/demands/{demand_id}", response_model=DemandResponse)
def get_demand(
    demand_id: UUID,
    db: Session = Depends(get_db),
) -> DemandResponse:
    try:
        return DemandResponse.model_validate(_service(db).get_demand(demand_id))
    except MarketplaceServiceError as error:
        _raise_http(error)


@router.post("/demands/{demand_id}/cancel", response_model=DemandResponse)
def cancel_demand(
    demand_id: UUID,
    payload: DemandCancelRequest,
    db: Session = Depends(get_db),
) -> DemandResponse:
    try:
        demand = _service(db).cancel_demand(demand_id, payload.operator_user_id)
        db.commit()
        return DemandResponse.model_validate(demand)
    except MarketplaceServiceError as error:
        db.rollback()
        _raise_http(error)


@router.post("/demands/{demand_id}/offers", response_model=OfferResponse)
def create_offer(
    demand_id: UUID,
    payload: OfferCreateRequest,
    db: Session = Depends(get_db),
) -> OfferResponse:
    try:
        offer = _service(db).create_offer(demand_id=demand_id, **payload.model_dump())
        db.commit()
        return OfferResponse.model_validate(offer)
    except MarketplaceServiceError as error:
        db.rollback()
        _raise_http(error)


@router.get("/demands/{demand_id}/offers", response_model=OfferListResponse)
def list_offers(
    demand_id: UUID,
    db: Session = Depends(get_db),
) -> OfferListResponse:
    try:
        offers = _service(db).list_offers(demand_id)
        return OfferListResponse(items=[OfferResponse.model_validate(offer) for offer in offers])
    except MarketplaceServiceError as error:
        _raise_http(error)


@router.post("/offers/{offer_id}/accept", response_model=AcceptOfferResponse)
def accept_offer(
    offer_id: UUID,
    payload: AcceptOfferRequest,
    db: Session = Depends(get_db),
) -> AcceptOfferResponse:
    try:
        result = _service(db).accept_offer(offer_id, payload.operator_user_id)
        db.commit()
        return AcceptOfferResponse(
            offer=OfferResponse.model_validate(result.offer),
            order=OrderResponse.model_validate(result.order),
        )
    except MarketplaceServiceError as error:
        db.rollback()
        _raise_http(error)


@router.post("/offers/{offer_id}/reject", response_model=OfferResponse)
def reject_offer(
    offer_id: UUID,
    db: Session = Depends(get_db),
) -> OfferResponse:
    try:
        offer = _service(db).update_offer_status(offer_id, "rejected")
        db.commit()
        return OfferResponse.model_validate(offer)
    except MarketplaceServiceError as error:
        db.rollback()
        _raise_http(error)


@router.post("/offers/{offer_id}/withdraw", response_model=OfferResponse)
def withdraw_offer(
    offer_id: UUID,
    db: Session = Depends(get_db),
) -> OfferResponse:
    try:
        offer = _service(db).update_offer_status(offer_id, "withdrawn")
        db.commit()
        return OfferResponse.model_validate(offer)
    except MarketplaceServiceError as error:
        db.rollback()
        _raise_http(error)


@router.get("/orders", response_model=OrderListResponse)
def list_orders(
    user_id: UUID,
    status: str | None = None,
    db: Session = Depends(get_db),
) -> OrderListResponse:
    orders = _service(db).list_orders(user_id=user_id, status=status)
    return OrderListResponse(items=[OrderResponse.model_validate(order) for order in orders])


@router.get("/orders/{order_id}", response_model=OrderDetailResponse)
def get_order(
    order_id: UUID,
    operator_user_id: UUID,
    db: Session = Depends(get_db),
) -> OrderDetailResponse:
    try:
        detail = _service(db).get_order_with_events(order_id, operator_user_id)
        return OrderDetailResponse(
            order=OrderResponse.model_validate(detail.order),
            events=[OrderEventResponse.model_validate(event) for event in detail.events],
        )
    except MarketplaceServiceError as error:
        _raise_http(error)


@router.post("/orders/{order_id}/transition", response_model=OrderResponse)
def transition_order(
    order_id: UUID,
    payload: OrderTransitionRequest,
    db: Session = Depends(get_db),
) -> OrderResponse:
    try:
        order = _service(db).transition_order(
            order_id,
            payload.action,
            payload.operator_user_id,
        )
        db.commit()
        return OrderResponse.model_validate(order)
    except MarketplaceServiceError as error:
        db.rollback()
        _raise_http(error)
