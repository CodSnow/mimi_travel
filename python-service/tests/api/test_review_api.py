from uuid import UUID
from datetime import UTC, datetime

from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.config.settings import settings
from app.models.order import Order
from app.models.review import Review
from app.models.service_feedback import ServiceFeedback
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


def _create_user(engine: Engine, phone: str, nickname: str):
    with _session_factory(engine)() as session:
        user = UserRepository(session).upsert_by_phone(phone=phone, nickname=nickname, avatar="cat")
        session.commit()
        return user


def _create_order(client, engine: Engine):
    customer = _create_user(engine, "13870000001", "评价用户")
    provider = _create_user(engine, "13870000002", "评价服务者")
    demand = client.post(
        "/internal/marketplace/demands",
        headers=headers,
        json={
            "user_id": str(customer.id),
            "service_type": "feeding",
            "title": "评价链路喂猫",
        },
    ).json()
    offer = client.post(
        f"/internal/marketplace/demands/{demand['id']}/offers",
        headers=headers,
        json={"provider_user_id": str(provider.id), "quote_amount_fen": 9000},
    ).json()
    accepted = client.post(
        f"/internal/marketplace/offers/{offer['id']}/accept",
        headers=headers,
        json={"operator_user_id": str(customer.id)},
    ).json()
    return accepted["order"], customer, provider


def _create_self_order(client, engine: Engine):
    user = _create_user(engine, "13870000003", "自接单用户")
    demand = client.post(
        "/internal/marketplace/demands",
        headers=headers,
        json={
            "user_id": str(user.id),
            "service_type": "feeding",
            "title": "自己接自己的单",
        },
    ).json()
    offer = client.post(
        f"/internal/marketplace/demands/{demand['id']}/offers",
        headers=headers,
        json={"provider_user_id": str(user.id), "quote_amount_fen": 9000},
    ).json()
    accepted = client.post(
        f"/internal/marketplace/offers/{offer['id']}/accept",
        headers=headers,
        json={"operator_user_id": str(user.id)},
    ).json()
    return accepted["order"], user


def test_create_and_list_order_review(client, engine: Engine):
    order, customer, provider = _create_order(client, engine)

    created = client.post(
        f"/internal/reviews/orders/{order['id']}/reviews",
        headers=headers,
        json={
            "reviewer_user_id": str(customer.id),
            "reviewee_user_id": str(provider.id),
            "overall_score": 5,
            "cat_care_score": 5,
            "punctuality_score": 4.8,
            "communication_score": 5,
            "tags": ["拍照及时", "细心照护"],
            "content": "很靠谱",
        },
    )

    assert created.status_code == 200
    body = created.json()
    assert body["order_id"] == order["id"]
    assert body["reviewer_user_id"] == str(customer.id)
    assert body["reviewee_user_id"] == str(provider.id)
    assert body["tags"] == ["拍照及时", "细心照护"]
    assert body["created_at"]

    with _session_factory(engine)() as session:
        saved = session.get(Review, UUID(body["id"]))
        assert saved is not None
        assert saved.content == "很靠谱"

    listed = client.get(f"/internal/reviews/providers/{provider.id}/reviews", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["items"][0]["id"] == body["id"]

    summary = client.post(
        "/internal/reviews/provider-summary",
        headers=headers,
        json={
            "meta": {
                "request_id": "review-summary-test",
                "source": "ts-bff",
                "timestamp": datetime.now(UTC).isoformat(),
            },
            "provider_user_id": str(provider.id),
        },
    )
    assert summary.status_code == 200
    assert summary.json()["review_count"] == 1
    assert summary.json()["overall_score"] == 5


def test_order_review_rejects_self_review_and_duplicate(client, engine: Engine):
    order, customer, provider = _create_order(client, engine)

    self_review = client.post(
        f"/internal/reviews/orders/{order['id']}/reviews",
        headers=headers,
        json={
            "reviewer_user_id": str(customer.id),
            "reviewee_user_id": str(customer.id),
            "overall_score": 5,
        },
    )
    assert self_review.status_code == 403

    created = client.post(
        f"/internal/reviews/orders/{order['id']}/reviews",
        headers=headers,
        json={
            "reviewer_user_id": str(customer.id),
            "reviewee_user_id": str(provider.id),
            "overall_score": 5,
        },
    )
    assert created.status_code == 200

    duplicated = client.post(
        f"/internal/reviews/orders/{order['id']}/reviews",
        headers=headers,
        json={
            "reviewer_user_id": str(customer.id),
            "reviewee_user_id": str(provider.id),
            "overall_score": 4,
        },
    )
    assert duplicated.status_code == 409


def test_order_review_rejects_order_where_buyer_and_seller_are_same_user(client, engine: Engine):
    order, user = _create_self_order(client, engine)

    response = client.post(
        f"/internal/reviews/orders/{order['id']}/reviews",
        headers=headers,
        json={
            "reviewer_user_id": str(user.id),
            "reviewee_user_id": str(user.id),
            "overall_score": 5,
        },
    )

    assert response.status_code == 403


def test_order_feedback_requires_seller_operator(client, engine: Engine):
    order, customer, _provider = _create_order(client, engine)

    response = client.post(
        f"/internal/reviews/orders/{order['id']}/feedback",
        headers=headers,
        json={
            "operator_user_id": str(customer.id),
            "note": "买家不能代服务者提交反馈",
        },
    )

    assert response.status_code == 403


def test_create_and_list_order_feedback_updates_order_summary(client, engine: Engine):
    order, _customer, provider = _create_order(client, engine)

    created = client.post(
        f"/internal/reviews/orders/{order['id']}/feedback",
        headers=headers,
        json={
            "operator_user_id": str(provider.id),
            "provider_user_id": str(provider.id),
            "note": "已完成喂食和清洁",
            "photo_urls": ["https://example.com/a.jpg"],
            "video_urls": [],
        },
    )

    assert created.status_code == 200
    body = created.json()
    assert body["order_id"] == order["id"]
    assert body["provider_user_id"] == str(provider.id)
    assert body["note"] == "已完成喂食和清洁"

    with _session_factory(engine)() as session:
        saved_feedback = session.get(ServiceFeedback, UUID(body["id"]))
        saved_order = session.get(Order, UUID(order["id"]))
        assert saved_feedback is not None
        assert saved_order is not None
        assert saved_order.feedback_summary["lastFeedbackId"] == body["id"]
        assert saved_order.feedback_summary["photoCount"] == 1

    listed = client.get(f"/internal/reviews/orders/{order['id']}/feedback", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["items"][0]["id"] == body["id"]
