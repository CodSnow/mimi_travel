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


def test_real_provider_requires_configuration(db: Session, customer, pending_order, monkeypatch):
    monkeypatch.setattr("app.services.payments.payment_service.settings.alipay_app_id", None)
    monkeypatch.setattr("app.services.payments.payment_service.settings.alipay_private_key", None)
    monkeypatch.setattr("app.services.payments.payment_service.settings.alipay_public_key", None)
    monkeypatch.setattr("app.services.payments.payment_service.settings.alipay_notify_url", None)
    service = PaymentService(PaymentRepository(db))

    with pytest.raises(PaymentServiceError, match="alipay payment provider is not configured") as error:
        service.create_payment(
            order_id=pending_order.id,
            channel="alipay",
            provider="alipay",
            scene="deposit",
            operator_user_id=customer.id,
            idempotency_key="real-alipay-once",
        )

    assert error.value.status_code == 503
    assert PaymentRepository(db).get_payment_by_idempotency_key("real-alipay-once") is None


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


def test_query_refund_returns_provider_status(db: Session, customer, pending_order):
    service = PaymentService(PaymentRepository(db))
    payment = service.create_payment(
        order_id=pending_order.id,
        channel="alipay",
        scene="full",
        operator_user_id=customer.id,
    ).payment

    result = service.query_refund(
        payment.id,
        operator_user_id=customer.id,
        provider_refund_no="RF202605150001",
    )

    assert result["status"] == "success"
    assert result["provider_refund_no"] == "RF202605150001"


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


def test_refund_amount_boundaries(db: Session, customer, pending_order):
    service = PaymentService(PaymentRepository(db))
    payment = service.create_payment(
        order_id=pending_order.id,
        channel="alipay",
        scene="full",
        operator_user_id=customer.id,
    ).payment
    service.query_payment(payment.id, operator_user_id=customer.id, mark_paid=True)

    with pytest.raises(PaymentServiceError, match="invalid refund amount"):
        service.refund_payment(payment.id, operator_user_id=customer.id, refund_amount_fen=0)

    with pytest.raises(PaymentServiceError, match="invalid refund amount"):
        service.refund_payment(payment.id, operator_user_id=customer.id, refund_amount_fen=payment.amount_fen + 1)


def test_notify_rejects_failed_verification(db: Session, customer, pending_order):
    service = PaymentService(PaymentRepository(db))
    payment = service.create_payment(
        order_id=pending_order.id,
        channel="alipay",
        scene="deposit",
        operator_user_id=customer.id,
    ).payment

    with pytest.raises(PaymentServiceError, match="verification failed"):
        service.notify_paid(
            payment.out_trade_no,
            provider_trade_no="local-trade-failed",
            raw_payload={"verified_notify": {"verified": False}},
        )


def test_notify_rejects_amount_mismatch(db: Session, customer, pending_order):
    service = PaymentService(PaymentRepository(db))
    payment = service.create_payment(
        order_id=pending_order.id,
        channel="alipay",
        scene="deposit",
        operator_user_id=customer.id,
    ).payment

    with pytest.raises(PaymentServiceError, match="amount mismatch"):
        service.notify_paid(
            payment.out_trade_no,
            provider_trade_no="local-trade-amount",
            raw_payload={
                "verified_notify": {
                    "verified": True,
                    "provider": "local",
                    "channel": "alipay",
                    "amount_fen": payment.amount_fen + 1,
                }
            },
        )


def test_notify_rejects_terminal_payment(db: Session, customer, pending_order):
    service = PaymentService(PaymentRepository(db))
    payment = service.create_payment(
        order_id=pending_order.id,
        channel="alipay",
        scene="deposit",
        operator_user_id=customer.id,
    ).payment
    service.close_payment(payment.id, operator_user_id=customer.id)

    with pytest.raises(PaymentServiceError, match="terminal payment"):
        service.notify_paid(
            payment.out_trade_no,
            provider_trade_no="local-trade-closed",
            raw_payload={"verified_notify": {"verified": True, "provider": "local", "channel": "alipay"}},
        )
