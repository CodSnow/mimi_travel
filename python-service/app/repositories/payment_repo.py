import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.order_event import OrderEvent
from app.models.payment import Payment
from app.models.payment_event import PaymentEvent
from app.models.refund import Refund


class PaymentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_order(self, order_id: uuid.UUID) -> Order | None:
        return self.db.get(Order, order_id)

    def get_payment(self, payment_id: uuid.UUID) -> Payment | None:
        return self.db.get(Payment, payment_id)

    def get_payment_by_out_trade_no(self, out_trade_no: str) -> Payment | None:
        return self.db.execute(select(Payment).where(Payment.out_trade_no == out_trade_no)).scalar_one_or_none()

    def get_payment_by_idempotency_key(self, idempotency_key: str) -> Payment | None:
        return self.db.execute(select(Payment).where(Payment.idempotency_key == idempotency_key)).scalar_one_or_none()

    def latest_payment_for_order(self, order_id: uuid.UUID) -> Payment | None:
        stmt = select(Payment).where(Payment.order_id == order_id).order_by(desc(Payment.created_at), Payment.id)
        return self.db.execute(stmt).scalars().first()

    def create_payment(
        self,
        order_id: uuid.UUID,
        channel: str,
        scene: str,
        amount_fen: int,
        out_trade_no: str,
        idempotency_key: str | None,
        channel_payload: dict[str, Any],
    ) -> Payment:
        payment = Payment(
            order_id=order_id,
            channel=channel,
            scene=scene,
            amount_fen=amount_fen,
            status="pending",
            out_trade_no=out_trade_no,
            idempotency_key=idempotency_key,
            channel_payload=channel_payload,
            event_summary={"created": datetime.now(UTC).isoformat()},
        )
        self.db.add(payment)
        self.db.flush()
        self.db.refresh(payment)
        return payment

    def create_refund(
        self,
        payment_id: uuid.UUID,
        order_id: uuid.UUID,
        refund_amount_fen: int,
        reason: str | None,
        provider_refund_no: str | None = None,
        status: str = "success",
    ) -> Refund:
        refund = Refund(
            payment_id=payment_id,
            order_id=order_id,
            refund_amount_fen=refund_amount_fen,
            status=status,
            provider_refund_no=provider_refund_no,
            reason=reason,
        )
        self.db.add(refund)
        self.db.flush()
        self.db.refresh(refund)
        return refund

    def create_payment_event(
        self,
        order_id: uuid.UUID,
        event_type: str,
        provider: str,
        payment_id: uuid.UUID | None = None,
        refund_id: uuid.UUID | None = None,
        payload: dict[str, Any] | None = None,
    ) -> PaymentEvent:
        event = PaymentEvent(
            payment_id=payment_id,
            refund_id=refund_id,
            order_id=order_id,
            event_type=event_type,
            provider=provider,
            payload=payload,
        )
        self.db.add(event)
        self.db.flush()
        self.db.refresh(event)
        return event

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

    def list_payment_events(self, payment_id: uuid.UUID) -> list[PaymentEvent]:
        stmt = select(PaymentEvent).where(PaymentEvent.payment_id == payment_id).order_by(PaymentEvent.created_at)
        return list(self.db.execute(stmt).scalars().all())

    def list_refunds_for_payment(self, payment_id: uuid.UUID) -> list[Refund]:
        stmt = select(Refund).where(Refund.payment_id == payment_id).order_by(Refund.created_at, Refund.id)
        return list(self.db.execute(stmt).scalars().all())
