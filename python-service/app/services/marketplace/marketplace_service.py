import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from app.models.demand import Demand
from app.models.offer import Offer
from app.models.order import Order
from app.models.order_event import OrderEvent
from app.repositories.marketplace_repo import MarketplaceRepository, MarketplaceRepositoryError
from app.services.orders.order_state_service import OrderStateError, OrderStateService


class MarketplaceServiceError(ValueError):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class AcceptOfferResult:
    offer: Offer
    order: Order


@dataclass(frozen=True)
class OrderDetail:
    order: Order
    events: list[OrderEvent]


class MarketplaceService:
    def __init__(
        self,
        repo: MarketplaceRepository,
        order_state_service: OrderStateService,
    ) -> None:
        self.repo = repo
        self.order_state_service = order_state_service

    def create_demand(
        self,
        user_id: uuid.UUID,
        service_type: str,
        title: str,
        description: str | None = None,
        pet_summary: str | None = None,
        pet_ids: list[str] | None = None,
        pet_snapshot: dict[str, Any] | None = None,
        budget_min_fen: int | None = None,
        budget_max_fen: int | None = None,
        expected_price_fen: int | None = None,
        contact_name: str | None = None,
        contact_phone: str | None = None,
        allow_bargain: bool = False,
        visibility_radius_km: int = 5,
        district: str | None = None,
        pickup: dict[str, Any] | None = None,
        destination: dict[str, Any] | None = None,
        care_requirements: dict[str, Any] | None = None,
        ride_requirements: dict[str, Any] | None = None,
        service_time: datetime | None = None,
    ) -> Demand:
        return self.repo.create_demand(
            user_id=user_id,
            service_type=service_type,
            title=title,
            description=description,
            pet_summary=pet_summary,
            pet_ids=pet_ids,
            pet_snapshot=pet_snapshot,
            budget_min_fen=budget_min_fen,
            budget_max_fen=budget_max_fen,
            expected_price_fen=expected_price_fen,
            contact_name=contact_name,
            contact_phone=contact_phone,
            allow_bargain=allow_bargain,
            visibility_radius_km=visibility_radius_km,
            district=district,
            pickup=pickup,
            destination=destination,
            care_requirements=care_requirements,
            ride_requirements=ride_requirements,
            service_time=service_time,
        )

    def list_demands(
        self,
        service_type: str | None = None,
        district: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> list[Demand]:
        return self.repo.list_demands(
            service_type=service_type,
            district=district,
            status=status,
            page=max(page, 1),
            page_size=min(max(page_size, 1), 50),
        )

    def get_demand(self, demand_id: uuid.UUID) -> Demand:
        demand = self.repo.get_demand(demand_id)
        if demand is None:
            raise MarketplaceServiceError("demand not found", status_code=404)
        return demand

    def cancel_demand(self, demand_id: uuid.UUID, operator_user_id: uuid.UUID) -> Demand:
        demand = self.get_demand(demand_id)
        if demand.user_id != operator_user_id:
            raise MarketplaceServiceError("only demand owner can cancel demand", status_code=403)
        if demand.status in {"completed", "cancelled"}:
            raise MarketplaceServiceError("demand can not be cancelled in current status", status_code=409)

        demand.status = "cancelled"
        for offer in self.repo.list_offers(demand.id):
            if offer.status == "submitted":
                self.repo.update_offer_status(offer, "rejected")
        self.repo.db.flush()
        self.repo.db.refresh(demand)
        return demand

    def create_offer(
        self,
        demand_id: uuid.UUID,
        provider_user_id: uuid.UUID,
        quote_amount_fen: int,
        message: str | None = None,
        eta_minutes: int | None = None,
        vehicle_id: uuid.UUID | None = None,
        service_plan: str | None = None,
    ) -> Offer:
        demand = self.get_demand(demand_id)
        if demand.status != "open":
            raise MarketplaceServiceError("demand is not open", status_code=409)
        try:
            return self.repo.create_offer(
                demand_id=demand_id,
                provider_user_id=provider_user_id,
                quote_amount_fen=quote_amount_fen,
                message=message,
                eta_minutes=eta_minutes,
                vehicle_id=vehicle_id,
                service_plan=service_plan,
            )
        except MarketplaceRepositoryError as error:
            raise MarketplaceServiceError(str(error), status_code=409) from error

    def list_offers(self, demand_id: uuid.UUID) -> list[Offer]:
        self.get_demand(demand_id)
        return self.repo.list_offers(demand_id)

    def accept_offer(self, offer_id: uuid.UUID, operator_user_id: uuid.UUID) -> AcceptOfferResult:
        offer = self._get_offer(offer_id)
        if offer.status != "submitted":
            raise MarketplaceServiceError("offer is not submitted", status_code=409)

        demand = self.get_demand(offer.demand_id)
        if demand.status != "open":
            raise MarketplaceServiceError("demand is not open", status_code=409)
        if demand.user_id != operator_user_id:
            raise MarketplaceServiceError("only demand owner can accept offer", status_code=403)

        self.repo.update_offer_status(offer, "accepted")
        for other_offer in self.repo.list_offers(demand.id):
            if other_offer.id != offer.id and other_offer.status == "submitted":
                self.repo.update_offer_status(other_offer, "rejected")

        demand.status = "matched"
        demand.selected_offer_id = offer.id
        order = self.repo.create_order_from_offer(demand, offer)
        self.repo.create_order_event(
            order.id,
            "offer_accepted",
            operator_user_id,
            {"offerId": str(offer.id)},
        )
        self.repo.db.flush()
        self.repo.db.refresh(demand)
        return AcceptOfferResult(offer=offer, order=order)

    def update_offer_status(self, offer_id: uuid.UUID, status: str) -> Offer:
        offer = self._get_offer(offer_id)
        if offer.status != "submitted":
            raise MarketplaceServiceError("offer is not submitted", status_code=409)
        if status not in {"rejected", "withdrawn"}:
            raise MarketplaceServiceError("unsupported offer status", status_code=422)
        return self.repo.update_offer_status(offer, status)

    def list_orders(
        self,
        user_id: uuid.UUID,
        status: str | None = None,
    ) -> list[Order]:
        return self.repo.list_orders_for_user(user_id, status=status)

    def get_order_with_events(self, order_id: uuid.UUID, operator_user_id: uuid.UUID) -> OrderDetail:
        order = self._get_order(order_id)
        self._ensure_order_access(order, operator_user_id)
        return OrderDetail(order=order, events=self.repo.list_order_events(order.id))

    def transition_order(
        self,
        order_id: uuid.UUID,
        action: str,
        operator_user_id: uuid.UUID,
    ) -> Order:
        order = self._get_order(order_id)
        self._ensure_order_access(order, operator_user_id)
        try:
            next_status = self.order_state_service.next_status(order.status, action)
        except OrderStateError as error:
            raise MarketplaceServiceError(str(error), status_code=409) from error

        order.status = next_status
        demand = self.get_demand(order.demand_id)
        if next_status == "serving":
            demand.status = "in_service"
        elif next_status == "completed":
            demand.status = "completed"
        elif next_status == "cancelled":
            demand.status = "cancelled"

        self.repo.create_order_event(order.id, f"order_{action}", operator_user_id)
        self.repo.db.flush()
        self.repo.db.refresh(order)
        self.repo.db.refresh(demand)
        return order

    def _get_offer(self, offer_id: uuid.UUID) -> Offer:
        offer = self.repo.get_offer(offer_id)
        if offer is None:
            raise MarketplaceServiceError("offer not found", status_code=404)
        return offer

    def _get_order(self, order_id: uuid.UUID) -> Order:
        order = self.repo.get_order(order_id)
        if order is None:
            raise MarketplaceServiceError("order not found", status_code=404)
        return order

    def _ensure_order_access(self, order: Order, operator_user_id: uuid.UUID) -> None:
        if operator_user_id not in {order.buyer_user_id, order.seller_user_id}:
            raise MarketplaceServiceError("order access denied", status_code=403)
