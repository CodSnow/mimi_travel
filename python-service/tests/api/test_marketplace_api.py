from uuid import UUID, uuid4

from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.config.settings import settings
from app.models.demand import Demand
from app.models.order import Order
from app.repositories.user_repo import UserRepository


headers = {"X-Internal-Token": settings.internal_api_token}


def _session_factory(engine: Engine):
    return sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True,
    )


def _create_user(engine: Engine, phone: str, nickname: str = "用户"):
    with _session_factory(engine)() as session:
        user = UserRepository(session).upsert_by_phone(
            phone=phone,
            nickname=nickname,
            avatar="cat",
        )
        session.commit()
        return user


def _create_demand(client, customer_id: UUID):
    response = client.post(
        "/internal/marketplace/demands",
        headers=headers,
        json={
            "user_id": str(customer_id),
            "service_type": "feeding",
            "title": "上门喂猫",
            "description": "每天晚上喂一次",
            "pet_summary": "一只三花",
            "budget_min_fen": 5000,
            "budget_max_fen": 8000,
            "expected_price_fen": 7000,
            "contact_name": "咪咪主人",
            "contact_phone": "13800000001",
            "allow_bargain": True,
            "visibility_radius_km": 5,
            "district": "拱墅区",
            "pickup": {"district": "拱墅区", "address": "祥符街道"},
            "care_requirements": {"needHomeVisit": True},
        },
    )
    assert response.status_code == 200
    return response.json()


def _create_offer(client, demand_id: str, provider_id: UUID, amount_fen: int = 9000):
    response = client.post(
        f"/internal/marketplace/demands/{demand_id}/offers",
        headers=headers,
        json={
            "provider_user_id": str(provider_id),
            "quote_amount_fen": amount_fen,
            "message": "可以上门",
        },
    )
    assert response.status_code == 200
    return response.json()


def test_create_list_get_and_cancel_demand(client, engine: Engine):
    customer = _create_user(engine, "13830000001", "需求用户")

    created = _create_demand(client, customer.id)

    assert created["user_id"] == str(customer.id)
    assert created["title"] == "上门喂猫"
    assert created["status"] == "open"

    with _session_factory(engine)() as session:
        saved_demand = session.get(Demand, UUID(created["id"]))
        assert saved_demand is not None
        assert saved_demand.user_id == customer.id

    listed = client.get(
        "/internal/marketplace/demands",
        headers=headers,
        params={"status": "open"},
    )
    assert listed.status_code == 200
    assert listed.json()["items"][0]["id"] == created["id"]

    fetched = client.get(f"/internal/marketplace/demands/{created['id']}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["id"] == created["id"]

    cancelled = client.post(
        f"/internal/marketplace/demands/{created['id']}/cancel",
        headers=headers,
        json={"operator_user_id": str(customer.id)},
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"


def test_offer_accept_order_and_transition_flow(client, engine: Engine):
    customer = _create_user(engine, "13830000002", "需求用户")
    provider = _create_user(engine, "13830000003", "服务者甲")
    other_provider = _create_user(engine, "13830000004", "服务者乙")
    demand = _create_demand(client, customer.id)
    accepted_offer = _create_offer(client, demand["id"], provider.id, 9000)
    other_offer = _create_offer(client, demand["id"], other_provider.id, 8500)

    offers = client.get(f"/internal/marketplace/demands/{demand['id']}/offers", headers=headers)
    assert offers.status_code == 200
    assert {offer["id"] for offer in offers.json()["items"]} == {accepted_offer["id"], other_offer["id"]}

    accepted = client.post(
        f"/internal/marketplace/offers/{accepted_offer['id']}/accept",
        headers=headers,
        json={"operator_user_id": str(customer.id)},
    )
    assert accepted.status_code == 200
    body = accepted.json()
    assert body["offer"]["status"] == "accepted"
    assert body["order"]["status"] == "pending_payment"
    assert body["order"]["deposit_fen"] == 2700

    with _session_factory(engine)() as session:
        saved_order = session.get(Order, UUID(body["order"]["id"]))
        assert saved_order is not None
        assert saved_order.buyer_user_id == customer.id
        assert saved_order.seller_user_id == provider.id
        saved_order.status = "paid"
        session.commit()

    transitioned = client.post(
        f"/internal/marketplace/orders/{body['order']['id']}/transition",
        headers=headers,
        json={
            "action": "start_service",
            "operator_user_id": str(provider.id),
        },
    )
    assert transitioned.status_code == 200
    assert transitioned.json()["status"] == "serving"

    order_detail = client.get(
        f"/internal/marketplace/orders/{body['order']['id']}",
        headers=headers,
        params={"operator_user_id": str(customer.id)},
    )
    assert order_detail.status_code == 200
    assert order_detail.json()["order"]["status"] == "serving"
    assert [event["event_type"] for event in order_detail.json()["events"]] == [
        "offer_accepted",
        "order_start_service",
    ]

    orders = client.get(
        "/internal/marketplace/orders",
        headers=headers,
        params={"user_id": str(customer.id)},
    )
    assert orders.status_code == 200
    assert orders.json()["items"][0]["id"] == body["order"]["id"]


def test_accept_offer_requires_demand_owner(client, engine: Engine):
    customer = _create_user(engine, "13830000005", "需求用户")
    provider = _create_user(engine, "13830000006", "服务者")
    stranger = _create_user(engine, "13830000007", "路人")
    demand = _create_demand(client, customer.id)
    offer = _create_offer(client, demand["id"], provider.id)

    response = client.post(
        f"/internal/marketplace/offers/{offer['id']}/accept",
        headers=headers,
        json={"operator_user_id": str(stranger.id)},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "only demand owner can accept offer"


def test_duplicate_active_offer_returns_conflict(client, engine: Engine):
    customer = _create_user(engine, "13830000008", "需求用户")
    provider = _create_user(engine, "13830000009", "服务者")
    demand = _create_demand(client, customer.id)
    _create_offer(client, demand["id"], provider.id)

    response = client.post(
        f"/internal/marketplace/demands/{demand['id']}/offers",
        headers=headers,
        json={
            "provider_user_id": str(provider.id),
            "quote_amount_fen": 9100,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "provider already has an active offer for this demand"


def test_invalid_order_transition_returns_conflict(client, engine: Engine):
    customer = _create_user(engine, "13830000010", "需求用户")
    provider = _create_user(engine, "13830000011", "服务者")
    demand = _create_demand(client, customer.id)
    offer = _create_offer(client, demand["id"], provider.id)
    accepted = client.post(
        f"/internal/marketplace/offers/{offer['id']}/accept",
        headers=headers,
        json={"operator_user_id": str(customer.id)},
    ).json()

    response = client.post(
        f"/internal/marketplace/orders/{accepted['order']['id']}/transition",
        headers=headers,
        json={
            "action": "start_service",
            "operator_user_id": str(provider.id),
        },
    )

    assert response.status_code == 409
    assert "can not perform" in response.json()["detail"]


def test_reject_and_withdraw_offer(client, engine: Engine):
    customer = _create_user(engine, "13830000012", "需求用户")
    provider = _create_user(engine, "13830000013", "服务者甲")
    other_provider = _create_user(engine, "13830000014", "服务者乙")
    demand = _create_demand(client, customer.id)
    offer = _create_offer(client, demand["id"], provider.id)
    other_offer = _create_offer(client, demand["id"], other_provider.id)

    rejected = client.post(f"/internal/marketplace/offers/{offer['id']}/reject", headers=headers)
    withdrawn = client.post(f"/internal/marketplace/offers/{other_offer['id']}/withdraw", headers=headers)

    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"
    assert withdrawn.status_code == 200
    assert withdrawn.json()["status"] == "withdrawn"


def test_unknown_demand_returns_not_found(client):
    response = client.get(f"/internal/marketplace/demands/{uuid4()}", headers=headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "demand not found"
