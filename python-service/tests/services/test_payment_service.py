import pytest
from sqlalchemy.orm import Session

from app.repositories.marketplace_repo import MarketplaceRepository
from app.repositories.payment_repo import PaymentRepository
from app.repositories.user_repo import UserRepository
from app.services.marketplace.marketplace_service import MarketplaceService
from app.services.orders.order_state_service import OrderStateService
from app.services.payments.payment_service import PaymentService, PaymentServiceError


@pytest.fixture
def customer(db: Session):
    return UserRepository(db).upsert_by_phone("13930000001", "支付用户", "cat")


@pytest.fixture
def provider(db: Session):
    return UserRepository(db).upsert_by_phone("13930000002", "支付服务者", "provider")


@pytest.fixture
def pending_order(db: Session, customer, provider):
    marketplace = MarketplaceService(MarketplaceRepository(db), OrderStateService())
    demand = marketplace.create_demand(customer.id, "feeding", "上门喂猫")
    offer = marketplace.create_offer(demand.id, provider.id, 12000)
    return marketplace.accept_offer(offer.id, customer.id).order


def test_create_payment_is_idempotent_and_writes_events(db: Session, customer, pending_order):
    service = PaymentService(PaymentRepository(db))

    first = service.create_payment(
        order_id=pending_order.id,
        channel="alipay",
        scene="deposit",
        operator_user_id=customer.id,
        idempotency_key="pay-once",
    )
    second = service.create_payment(
        order_id=pending_order.id,
        channel="alipay",
        scene="deposit",
        operator_user_id=customer.id,
        idempotency_key="pay-once",
    )

    assert first.payment.id == second.payment.id
    assert first.payment.status == "pending"
    assert first.channel_payload["pay_url"].startswith("mimi-travel://local-pay/alipay/")
    assert pending_order.payment_status == "pending"
    assert PaymentRepository(db).list_payment_events(first.payment.id)[0].event_type == "payment_created"


def test_query_mark_paid_updates_order_and_events(db: Session, customer, pending_order):
    repo = PaymentRepository(db)
    service = PaymentService(repo)
    payment = service.create_payment(
        order_id=pending_order.id,
        channel="wechat_pay",
        scene="full",
        operator_user_id=customer.id,
    ).payment

    paid = service.query_payment(
        payment.id,
        operator_user_id=customer.id,
        mark_paid=True,
        provider_trade_no="local-trade-1",
    )

    assert paid.status == "paid"
    assert paid.provider_trade_no == "local-trade-1"
    assert repo.get_order(pending_order.id).status == "paid"
    assert repo.get_order(pending_order.id).payment_status == "paid"
    assert [event.event_type for event in repo.list_payment_events(payment.id)] == [
        "payment_created",
        "payment_paid",
    ]


def test_refund_paid_payment_updates_refund_and_order_status(db: Session, customer, pending_order):
    repo = PaymentRepository(db)
    service = PaymentService(repo)
    payment = service.create_payment(
        order_id=pending_order.id,
        channel="alipay",
        scene="full",
        operator_user_id=customer.id,
    ).payment
    service.query_payment(payment.id, operator_user_id=customer.id, mark_paid=True)

    result = service.refund_payment(payment.id, operator_user_id=customer.id, reason="计划变更")

    assert result.refund.status == "success"
    assert result.payment.status == "refunded"
    assert repo.get_order(pending_order.id).status == "refunded"
    assert repo.get_order(pending_order.id).refund_status == "refunded"
    assert repo.list_refunds_for_payment(payment.id)[0].reason == "计划变更"


def test_refund_requires_paid_payment(db: Session, customer, pending_order):
    service = PaymentService(PaymentRepository(db))
    payment = service.create_payment(
        order_id=pending_order.id,
        channel="alipay",
        scene="full",
        operator_user_id=customer.id,
    ).payment

    with pytest.raises(PaymentServiceError, match="only paid payment"):
        service.refund_payment(payment.id, operator_user_id=customer.id)
