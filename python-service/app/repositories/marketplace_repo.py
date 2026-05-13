import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.demand import Demand
from app.models.offer import Offer
from app.models.order import Order
from app.models.order_event import OrderEvent


class MarketplaceRepositoryError(ValueError):
    pass


class MarketplaceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

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
        demand = Demand(
            user_id=user_id,
            service_type=service_type,
            title=title,
            description=description,
            pet_summary=pet_summary,
            pet_ids=pet_ids or [],
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
            status="open",
        )
        self.db.add(demand)
        self.db.flush()
        self.db.refresh(demand)
        return demand

    def list_demands(
        self,
        service_type: str | None = None,
        district: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> list[Demand]:
        stmt = select(Demand)
        if service_type:
            stmt = stmt.where(Demand.service_type == service_type)
        if district:
            stmt = stmt.where(Demand.district == district)
        if status:
            stmt = stmt.where(Demand.status == status)
        stmt = stmt.order_by(desc(Demand.created_at), Demand.id).offset((page - 1) * page_size).limit(page_size)
        return list(self.db.execute(stmt).scalars().all())

    def get_demand(self, demand_id: uuid.UUID) -> Demand | None:
        return self.db.get(Demand, demand_id)

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
        active_offer = self.db.execute(
            select(Offer).where(
                Offer.demand_id == demand_id,
                Offer.provider_user_id == provider_user_id,
                Offer.status.in_(["submitted", "accepted"]),
            )
        ).scalar_one_or_none()
        if active_offer is not None:
            raise MarketplaceRepositoryError("provider already has an active offer for this demand")

        offer = Offer(
            demand_id=demand_id,
            provider_user_id=provider_user_id,
            quote_amount_fen=quote_amount_fen,
            message=message,
            eta_minutes=eta_minutes,
            vehicle_id=vehicle_id,
            service_plan=service_plan,
            status="submitted",
        )
        self.db.add(offer)
        self.db.flush()
        self.db.refresh(offer)
        return offer

    def list_offers(self, demand_id: uuid.UUID) -> list[Offer]:
        stmt = select(Offer).where(Offer.demand_id == demand_id).order_by(Offer.created_at, Offer.id)
        return list(self.db.execute(stmt).scalars().all())

    def get_offer(self, offer_id: uuid.UUID) -> Offer | None:
        return self.db.get(Offer, offer_id)

    def update_offer_status(self, offer: Offer, status: str) -> Offer:
        offer.status = status
        self.db.flush()
        self.db.refresh(offer)
        return offer

    def create_order_from_offer(self, demand: Demand, offer: Offer) -> Order:
        existing_order = self.db.execute(
            select(Order).where(
                Order.demand_id == demand.id,
                Order.seller_user_id == offer.provider_user_id,
            )
        ).scalar_one_or_none()
        if existing_order is not None:
            return existing_order

        order = Order(
            demand_id=demand.id,
            buyer_user_id=demand.user_id,
            seller_user_id=offer.provider_user_id,
            title=demand.title,
            amount_fen=offer.quote_amount_fen,
            deposit_fen=min(offer.quote_amount_fen, int((offer.quote_amount_fen * 30 + 99) / 100)),
            status="pending_payment",
            service_time=demand.service_time,
            pickup=demand.pickup,
            destination=demand.destination,
            pet_snapshot=demand.pet_snapshot,
            vehicle_id=offer.vehicle_id,
            payment_status="unpaid",
            refund_status="none",
        )
        self.db.add(order)
        self.db.flush()
        self.db.refresh(order)
        return order

    def list_orders_for_user(self, user_id: uuid.UUID, status: str | None = None) -> list[Order]:
        stmt = select(Order).where((Order.buyer_user_id == user_id) | (Order.seller_user_id == user_id))
        if status:
            stmt = stmt.where(Order.status == status)
        stmt = stmt.order_by(desc(Order.updated_at), Order.id)
        return list(self.db.execute(stmt).scalars().all())

    def get_order(self, order_id: uuid.UUID) -> Order | None:
        return self.db.get(Order, order_id)

    def create_order_event(
        self,
        order_id: uuid.UUID,
        event_type: str,
        operator_user_id: uuid.UUID | None = None,
        payload: dict[str, Any] | None = None,
    ) -> OrderEvent:
        event = OrderEvent(
            order_id=order_id,
            event_type=event_type,
            operator_user_id=operator_user_id,
            payload=payload,
            created_at=datetime.now(UTC),
        )
        self.db.add(event)
        self.db.flush()
        self.db.refresh(event)
        return event

    def list_order_events(self, order_id: uuid.UUID) -> list[OrderEvent]:
        stmt = select(OrderEvent).where(OrderEvent.order_id == order_id).order_by(OrderEvent.created_at, OrderEvent.id)
        return list(self.db.execute(stmt).scalars().all())
