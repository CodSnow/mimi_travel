from uuid import UUID

from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.config.settings import settings
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
        user = UserRepository(session).upsert_by_phone(phone=phone, nickname=nickname, avatar="cat")
        session.commit()
        return user


def _create_order(client, engine: Engine):
    customer = _create_user(engine, "13850000001", "支付用户")
    provider = _create_user(engine, "13850000002", "支付服务者")
    demand = client.post(
        "/internal/marketplace/demands",
        headers=headers,
        json={
            "user_id": str(customer.id),
            "service_type": "feeding",
            "title": "上门喂猫",
        },
    ).json()
    offer = client.post(
        f"/internal/marketplace/demands/{demand['id']}/offers",
        headers=headers,
        json={
            "provider_user_id": str(provider.id),
            "quote_amount_fen": 10000,
        },
    ).json()
    accepted = client.post(
        f"/internal/marketplace/offers/{offer['id']}/accept",
        headers=headers,
        json={"operator_user_id": str(customer.id)},
    ).json()
    return accepted["order"], customer, provider


def test_payment_create_query_and_refund_api(client, engine: Engine):
    order, customer, _provider = _create_order(client, engine)

    created = client.post(
        "/internal/payments",
        headers=headers,
        json={
            "order_id": order["id"],
            "operator_user_id": str(customer.id),
            "channel": "alipay",
            "scene": "deposit",
            "idempotency_key": "api-payment-once",
        },
    )
    assert created.status_code == 200
    payment = created.json()["payment"]
    assert payment["status"] == "pending"
    assert created.json()["channel_payload"]["pay_url"].startswith("mimi-travel://local-pay/alipay/")

    fetched = client.get(
        f"/internal/payments/{payment['id']}",
        headers=headers,
        params={"operator_user_id": str(customer.id)},
    )
    assert fetched.status_code == 200
    assert fetched.json()["id"] == payment["id"]

    paid = client.post(
        f"/internal/payments/{payment['id']}/query",
        headers=headers,
        json={
            "operator_user_id": str(customer.id),
            "mark_paid": True,
            "provider_trade_no": "api-trade-no",
        },
    )
    assert paid.status_code == 200
    assert paid.json()["status"] == "paid"

    refunded = client.post(
        f"/internal/payments/{payment['id']}/refund",
        headers=headers,
        json={
            "operator_user_id": str(customer.id),
            "reason": "用户计划变更",
        },
    )
    assert refunded.status_code == 200
    assert refunded.json()["refund"]["status"] == "success"
    assert refunded.json()["payment"]["status"] == "refunded"


def test_message_and_location_api(client, engine: Engine):
    order, customer, provider = _create_order(client, engine)

    ensured = client.post(
        "/internal/messages/conversations/ensure-order",
        headers=headers,
        json={"order_id": order["id"]},
    )
    assert ensured.status_code == 200
    conversation = ensured.json()
    assert conversation["order_id"] == order["id"]

    sent = client.post(
        f"/internal/messages/conversations/{conversation['id']}",
        headers=headers,
        json={
            "sender_user_id": str(customer.id),
            "type": "text",
            "content": "我在楼下等",
            "client_msg_id": "api-msg-1",
        },
    )
    assert sent.status_code == 200
    assert sent.json()["related_order_id"] == order["id"]

    read = client.post(
        "/internal/messages/read",
        headers=headers,
        json={
            "conversation_id": conversation["id"],
            "user_id": str(provider.id),
            "last_read_message_id": sent.json()["id"],
        },
    )
    assert read.status_code == 200
    assert read.json()["last_read_message_id"] == sent.json()["id"]

    location = client.post(
        "/internal/locations/report",
        headers=headers,
        json={
            "order_id": order["id"],
            "user_id": str(provider.id),
            "lat": 30.2741,
            "lng": 120.1551,
            "address": "武林广场",
        },
    )
    assert location.status_code == 200
    assert location.json()["snapshot"]["order_id"] == order["id"]
    assert location.json()["message_id"]

    detail = client.get(
        f"/internal/messages/conversations/{conversation['id']}",
        headers=headers,
        params={"operator_user_id": str(customer.id)},
    )
    assert detail.status_code == 200
    assert [item["type"] for item in detail.json()["messages"]] == ["text", "location"]

    locations = client.get(
        f"/internal/locations/orders/{order['id']}",
        headers=headers,
        params={"operator_user_id": str(customer.id)},
    )
    assert locations.status_code == 200
    assert UUID(locations.json()["items"][0]["id"]) == UUID(location.json()["snapshot"]["id"])
