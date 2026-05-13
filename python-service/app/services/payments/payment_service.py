import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from app.models.order import Order
from app.models.payment import Payment
from app.models.refund import Refund
from app.repositories.payment_repo import PaymentRepository
from app.services.payments.local_provider import LocalPaymentProvider


class PaymentServiceError(ValueError):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class PaymentResult:
    payment: Payment
    channel_payload: dict[str, Any]


@dataclass(frozen=True)
class RefundResult:
    payment: Payment
    refund: Refund


class PaymentService:
    def __init__(self, repo: PaymentRepository) -> None:
        self.repo = repo

    def create_payment(
        self,
        order_id: uuid.UUID,
        channel: str,
        scene: str,
        operator_user_id: uuid.UUID,
        amount_fen: int | None = None,
        idempotency_key: str | None = None,
    ) -> PaymentResult:
        if idempotency_key:
            existing = self.repo.get_payment_by_idempotency_key(idempotency_key)
            if existing is not None:
                return PaymentResult(payment=existing, channel_payload=existing.channel_payload or {})

        order = self._get_order(order_id)
        self._ensure_order_access(order, operator_user_id)
        if order.status not in {"pending_payment", "paid"}:
            raise PaymentServiceError("order can not create payment in current status", status_code=409)

        payment_amount = amount_fen or order.deposit_fen or order.amount_fen
        if payment_amount <= 0:
            raise PaymentServiceError("payment amount must be positive", status_code=422)

        provider = self._provider(channel)
        out_trade_no = self._new_out_trade_no()
        provider_payload = provider.create_payment(
            out_trade_no=out_trade_no,
            amount_fen=payment_amount,
            subject=order.title,
        )
        payment = self.repo.create_payment(
            order_id=order.id,
            channel=channel,
            scene=scene,
            amount_fen=payment_amount,
            out_trade_no=out_trade_no,
            idempotency_key=idempotency_key,
            channel_payload=provider_payload,
        )
        order.payment_status = "pending"
        self.repo.create_payment_event(
            order_id=order.id,
            payment_id=payment.id,
            event_type="payment_created",
            provider=channel,
            payload=provider_payload,
        )
        self.repo.create_order_event(
            order.id,
            "payment_created",
            operator_user_id,
            {"paymentId": str(payment.id), "amountFen": payment.amount_fen, "channel": channel},
        )
        self.repo.db.flush()
        self.repo.db.refresh(order)
        return PaymentResult(payment=payment, channel_payload=provider_payload)

    def get_payment(self, payment_id: uuid.UUID, operator_user_id: uuid.UUID) -> Payment:
        payment = self._get_payment(payment_id)
        order = self._get_order(payment.order_id)
        self._ensure_order_access(order, operator_user_id)
        return payment

    def query_payment(
        self,
        payment_id: uuid.UUID,
        operator_user_id: uuid.UUID,
        mark_paid: bool = False,
        provider_trade_no: str | None = None,
        raw_payload: dict[str, Any] | None = None,
    ) -> Payment:
        payment = self._get_payment(payment_id)
        order = self._get_order(payment.order_id)
        self._ensure_order_access(order, operator_user_id)
        provider = self._provider(payment.channel)
        provider_result = provider.query(payment.out_trade_no, mark_paid=mark_paid)
        payment.query_count += 1
        if mark_paid:
            self._mark_paid(payment, order, provider_trade_no, raw_payload or provider_result, operator_user_id)
        else:
            payment.event_summary = {**(payment.event_summary or {}), "lastQuery": datetime.now(UTC).isoformat()}
            self.repo.create_payment_event(
                order_id=order.id,
                payment_id=payment.id,
                event_type="payment_queried",
                provider=payment.channel,
                payload=provider_result,
            )
        self.repo.db.flush()
        self.repo.db.refresh(payment)
        return payment

    def notify_paid(
        self,
        out_trade_no: str,
        provider_trade_no: str | None,
        raw_payload: dict[str, Any],
    ) -> Payment:
        payment = self.repo.get_payment_by_out_trade_no(out_trade_no)
        if payment is None:
            raise PaymentServiceError("payment not found", status_code=404)
        order = self._get_order(payment.order_id)
        self._mark_paid(payment, order, provider_trade_no, raw_payload, operator_user_id=None)
        self.repo.db.flush()
        self.repo.db.refresh(payment)
        return payment

    def close_payment(self, payment_id: uuid.UUID, operator_user_id: uuid.UUID) -> Payment:
        payment = self._get_payment(payment_id)
        order = self._get_order(payment.order_id)
        self._ensure_order_access(order, operator_user_id)
        if payment.status == "paid":
            raise PaymentServiceError("paid payment can not be closed", status_code=409)
        provider_result = self._provider(payment.channel).close(payment.out_trade_no)
        payment.status = "closed"
        order.payment_status = "closed"
        payment.event_summary = {**(payment.event_summary or {}), "closed": datetime.now(UTC).isoformat()}
        self.repo.create_payment_event(
            order_id=order.id,
            payment_id=payment.id,
            event_type="payment_closed",
            provider=payment.channel,
            payload=provider_result,
        )
        self.repo.create_order_event(
            order.id,
            "payment_closed",
            operator_user_id,
            {"paymentId": str(payment.id)},
        )
        self.repo.db.flush()
        self.repo.db.refresh(payment)
        return payment

    def refund_payment(
        self,
        payment_id: uuid.UUID,
        operator_user_id: uuid.UUID,
        reason: str | None = None,
        refund_amount_fen: int | None = None,
    ) -> RefundResult:
        payment = self._get_payment(payment_id)
        order = self._get_order(payment.order_id)
        self._ensure_order_access(order, operator_user_id)
        if payment.status != "paid":
            raise PaymentServiceError("only paid payment can be refunded", status_code=409)

        amount = refund_amount_fen or payment.amount_fen
        if amount <= 0 or amount > payment.amount_fen:
            raise PaymentServiceError("invalid refund amount", status_code=422)

        provider_result = self._provider(payment.channel).refund(
            out_trade_no=payment.out_trade_no,
            refund_amount_fen=amount,
            reason=reason or "用户申请退款",
        )
        refund = self.repo.create_refund(
            payment_id=payment.id,
            order_id=order.id,
            refund_amount_fen=amount,
            reason=reason,
            provider_refund_no=f"RF{uuid.uuid4().hex[:20].upper()}",
            status=provider_result["status"],
        )
        payment.status = "refunded" if amount == payment.amount_fen else "partial_refunded"
        order.refund_status = "refunded" if amount == payment.amount_fen else "partial_refunded"
        if amount == payment.amount_fen:
            order.status = "refunded"
        payment.event_summary = {**(payment.event_summary or {}), "refunded": datetime.now(UTC).isoformat()}
        self.repo.create_payment_event(
            order_id=order.id,
            payment_id=payment.id,
            refund_id=refund.id,
            event_type="refund_succeeded",
            provider=payment.channel,
            payload=provider_result,
        )
        self.repo.create_order_event(
            order.id,
            "refund_succeeded",
            operator_user_id,
            {"paymentId": str(payment.id), "refundId": str(refund.id), "amountFen": amount},
        )
        self.repo.db.flush()
        self.repo.db.refresh(payment)
        self.repo.db.refresh(refund)
        return RefundResult(payment=payment, refund=refund)

    def _mark_paid(
        self,
        payment: Payment,
        order: Order,
        provider_trade_no: str | None,
        raw_payload: dict[str, Any],
        operator_user_id: uuid.UUID | None,
    ) -> None:
        if payment.status == "paid":
            return
        payment.status = "paid"
        payment.provider_trade_no = provider_trade_no
        payment.raw_notify = str(raw_payload)
        payment.paid_at = datetime.now(UTC)
        payment.event_summary = {**(payment.event_summary or {}), "paid": payment.paid_at.isoformat()}
        order.payment_status = "paid"
        if order.status == "pending_payment":
            order.status = "paid"
        self.repo.create_payment_event(
            order_id=order.id,
            payment_id=payment.id,
            event_type="payment_paid",
            provider=payment.channel,
            payload=raw_payload,
        )
        self.repo.create_order_event(
            order.id,
            "payment_paid",
            operator_user_id,
            {"paymentId": str(payment.id), "providerTradeNo": provider_trade_no},
        )

    def _get_order(self, order_id: uuid.UUID) -> Order:
        order = self.repo.get_order(order_id)
        if order is None:
            raise PaymentServiceError("order not found", status_code=404)
        return order

    def _get_payment(self, payment_id: uuid.UUID) -> Payment:
        payment = self.repo.get_payment(payment_id)
        if payment is None:
            raise PaymentServiceError("payment not found", status_code=404)
        return payment

    def _ensure_order_access(self, order: Order, operator_user_id: uuid.UUID) -> None:
        if operator_user_id not in {order.buyer_user_id, order.seller_user_id}:
            raise PaymentServiceError("order access denied", status_code=403)

    def _provider(self, channel: str) -> LocalPaymentProvider:
        try:
            return LocalPaymentProvider(channel)
        except ValueError as error:
            raise PaymentServiceError(str(error), status_code=422) from error

    def _new_out_trade_no(self) -> str:
        return f"MIMI{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:8].upper()}"
