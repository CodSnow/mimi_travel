import pytest
from sqlalchemy.orm import Session

from app.repositories.marketplace_repo import MarketplaceRepository, MarketplaceRepositoryError
from app.repositories.user_repo import UserRepository


@pytest.fixture
def demo_customer(db: Session):
    return UserRepository(db).upsert_by_phone(
        phone="13810000001",
        nickname="需求用户",
        avatar="cat",
    )


@pytest.fixture
def demo_provider(db: Session):
    return UserRepository(db).upsert_by_phone(
        phone="13810000002",
        nickname="服务者",
        avatar="provider",
    )


def test_create_and_list_demand(db: Session, demo_customer):
    repo = MarketplaceRepository(db)

    demand = repo.create_demand(
        user_id=demo_customer.id,
        service_type="feeding",
        title="上门喂猫",
        description="每天晚上喂一次",
        pet_summary="一只三花",
        budget_min_fen=5000,
        budget_max_fen=8000,
        expected_price_fen=7000,
        contact_name="咪咪主人",
        contact_phone="13800000001",
        allow_bargain=True,
        visibility_radius_km=5,
        district="拱墅区",
        pickup={"district": "拱墅区", "address": "祥符街道"},
        destination=None,
        care_requirements={"needHomeVisit": True},
        ride_requirements=None,
    )

    assert demand.status == "open"
    assert demand.budget_min_fen == 5000
    assert demand.pickup == {"district": "拱墅区", "address": "祥符街道"}
    assert repo.get_demand(demand.id).id == demand.id
    assert [item.id for item in repo.list_demands(status="open")] == [demand.id]


def test_create_offer_rejects_duplicate_active_offer(
    db: Session,
    demo_customer,
    demo_provider,
):
    repo = MarketplaceRepository(db)
    demand = repo.create_demand(
        user_id=demo_customer.id,
        service_type="feeding",
        title="上门喂猫",
    )

    offer = repo.create_offer(
        demand_id=demand.id,
        provider_user_id=demo_provider.id,
        quote_amount_fen=8800,
        message="可以上门",
    )

    assert offer.status == "submitted"
    assert offer.message == "可以上门"

    with pytest.raises(MarketplaceRepositoryError, match="active offer"):
        repo.create_offer(
            demand_id=demand.id,
            provider_user_id=demo_provider.id,
            quote_amount_fen=8900,
        )


def test_create_order_and_order_event(db: Session, demo_customer, demo_provider):
    repo = MarketplaceRepository(db)
    demand = repo.create_demand(
        user_id=demo_customer.id,
        service_type="feeding",
        title="上门喂猫",
    )
    offer = repo.create_offer(demand.id, demo_provider.id, 8800)

    order = repo.create_order_from_offer(demand, offer)
    event = repo.create_order_event(
        order.id,
        "offer_accepted",
        demo_customer.id,
        {"offerId": str(offer.id)},
    )

    assert order.status == "pending_payment"
    assert order.buyer_user_id == demo_customer.id
    assert order.seller_user_id == demo_provider.id
    assert order.deposit_fen == 2640
    assert event.event_type == "offer_accepted"
    assert repo.list_order_events(order.id)[0].id == event.id
