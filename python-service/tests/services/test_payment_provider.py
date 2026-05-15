import pytest

from app.services.payments.local_provider import LocalPaymentProvider
from app.services.payments.providers import PaymentProviderError, RealPaymentProvider, RealProviderConfig


def test_create_local_payment_payload():
    provider = LocalPaymentProvider(channel="alipay")
    result = provider.create_payment(
        out_trade_no="MIMI202605130001",
        amount_fen=9900,
        subject="咪咪出行订单",
    )
    assert result["status"] == "pending"
    assert result["channel"] == "alipay"
    assert result["amount_fen"] == 9900
    assert result["subject"] == "咪咪出行订单"
    assert result["app_params"] == {
        "channel": "alipay",
        "outTradeNo": "MIMI202605130001",
        "amountFen": "9900",
    }
    assert result["pay_url"].startswith("mimi-travel://local-pay/alipay/")
    assert result["pay_url"].endswith("/MIMI202605130001")


def test_refund_local_payment_payload():
    provider = LocalPaymentProvider(channel="wechat_pay")
    result = provider.refund(
        out_trade_no="MIMI202605130002",
        refund_amount_fen=3000,
        reason="用户取消",
    )
    assert result["status"] == "success"
    assert result["refund_amount_fen"] == 3000


def test_query_and_close_local_payment_payload():
    provider = LocalPaymentProvider(channel="alipay")

    pending = provider.query(out_trade_no="MIMI202605130003")
    paid = provider.query(out_trade_no="MIMI202605130003", mark_paid=True)
    closed = provider.close(out_trade_no="MIMI202605130003")

    assert pending["status"] == "pending"
    assert paid["status"] == "paid"
    assert closed["status"] == "closed"


def test_local_refund_query_and_notify_payload():
    provider = LocalPaymentProvider(channel="wechat_pay")

    refund = provider.query_refund(
        out_trade_no="MIMI202605130004",
        provider_refund_no="RF202605130004",
    )
    notify = provider.verify_notify(
        headers={},
        payload={"out_trade_no": "MIMI202605130004"},
    )

    assert refund["status"] == "success"
    assert refund["provider"] == "local"
    assert notify["verified"] is True
    assert notify["payload"]["out_trade_no"] == "MIMI202605130004"


def test_real_provider_not_configured_payloads_fail_clearly():
    provider = RealPaymentProvider(
        RealProviderConfig(
            provider="alipay",
            required_fields={"MIMI_ALIPAY_APP_ID": None},
        )
    )

    with pytest.raises(PaymentProviderError, match="alipay payment provider is not configured"):
        provider.create_payment(
            out_trade_no="MIMI202605130005",
            amount_fen=9900,
            subject="咪咪出行订单",
        )


def test_rejects_unsupported_channel():
    with pytest.raises(ValueError, match="unsupported local payment channel"):
        LocalPaymentProvider(channel="unionpay")
