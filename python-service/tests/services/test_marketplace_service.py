import pytest
from sqlalchemy.orm import Session

from app.repositories.marketplace_repo import MarketplaceRepository
from app.repositories.user_repo import UserRepository
from app.services.marketplace.marketplace_service import MarketplaceService, MarketplaceServiceError
from app.services.orders.order_state_service import OrderStateService


@pytest.fixture
def demo_customer(db: Session):
    return UserRepository(db).upsert_by_phone(
        phone="13820000001",
        nickname="需求用户",
        avatar="cat",
    )


@pytest.fixture
def demo_provider(db: Session):
    return UserRepository(db).upsert_by_phone(
        phone="13820000002",
        nickname="服务者甲",
        avatar="provider-a",
    )


@pytest.fixture
def another_provider(db: Session):
    return UserRepository(db).upsert_by_phone(
        phone="13820000003",
        nickname="服务者乙",
        avatar="provider-b",
    )


def test_accept_offer_rejects_other_submitted_offers_and_creates_order(
    db: Session,
    demo_customer,
    demo_provider,
    another_provider,
):
    repo = MarketplaceRepository(db)
    service = MarketplaceService(repo, OrderStateService())
    demand = service.create_demand(
        user_id=demo_customer.id,
        service_type="feeding",
        title="上门喂猫",
    )
    accepted = service.create_offer(demand.id, demo_provider.id, quote_amount_fen=9000)
    other = service.create_offer(demand.id, another_provider.id, quote_amount_fen=8500)

    result = service.accept_offer(accepted.id, operator_user_id=demo_customer.id)

    assert result.offer.status == "accepted"
    assert result.order.status == "pending_payment"
    assert repo.get_offer(other.id).status == "rejected"
    assert repo.get_demand(demand.id).status == "matched"
    assert repo.get_demand(demand.id).selected_offer_id == accepted.id
    assert repo.list_order_events(result.order.id)[0].event_type == "offer_accepted"


def test_accept_offer_requires_demand_owner(
    db: Session,
    demo_customer,
    demo_provider,
    another_provider,
):
    repo = MarketplaceRepository(db)
    service = MarketplaceService(repo, OrderStateService())
    demand = service.create_demand(
        user_id=demo_customer.id,
        service_type="feeding",
        title="上门喂猫",
    )
    offer = service.create_offer(demand.id, demo_provider.id, quote_amount_fen=9000)

    with pytest.raises(MarketplaceServiceError, match="only demand owner"):
        service.accept_offer(offer.id, operator_user_id=another_provider.id)


def test_order_transition_updates_order_demand_and_event(
    db: Session,
    demo_customer,
    demo_provider,
):
    repo = MarketplaceRepository(db)
    service = MarketplaceService(repo, OrderStateService())
    demand = service.create_demand(
        user_id=demo_customer.id,
        service_type="feeding",
        title="上门喂猫",
    )
    offer = service.create_offer(demand.id, demo_provider.id, quote_amount_fen=9000)
    result = service.accept_offer(offer.id, operator_user_id=demo_customer.id)
    result.order.status = "paid"
    db.flush()

    transitioned = service.transition_order(
        result.order.id,
        "start_service",
        operator_user_id=demo_provider.id,
    )

    assert transitioned.status == "serving"
    assert repo.get_demand(demand.id).status == "in_service"
    assert repo.list_order_events(result.order.id)[-1].event_type == "order_start_service"
