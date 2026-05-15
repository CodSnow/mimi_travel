from uuid import UUID
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.repositories.payment_repo import PaymentRepository
from app.schemas.payments import (
    PaymentCloseRequest,
    PaymentCreateRequest,
    PaymentCreateResponse,
    PaymentNotifyRequest,
    PaymentQueryRequest,
    PaymentResponse,
    RefundCreateRequest,
    RefundCreateResponse,
    RefundQueryRequest,
    RefundResponse,
)
from app.services.payments.payment_service import PaymentService, PaymentServiceError


router = APIRouter(dependencies=[Depends(verify_internal_token)])


def _service(db: Session) -> PaymentService:
    return PaymentService(PaymentRepository(db))


def _raise_http(error: PaymentServiceError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error))


@router.post("", response_model=PaymentCreateResponse)
def create_payment(payload: PaymentCreateRequest, db: Session = Depends(get_db)) -> PaymentCreateResponse:
    try:
        result = _service(db).create_payment(**payload.model_dump())
        db.commit()
        return PaymentCreateResponse(
            payment=PaymentResponse.model_validate(result.payment),
            channel_payload=result.channel_payload,
        )
    except PaymentServiceError as error:
        db.rollback()
        _raise_http(error)


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: UUID,
    operator_user_id: UUID,
    db: Session = Depends(get_db),
) -> PaymentResponse:
    try:
        return PaymentResponse.model_validate(_service(db).get_payment(payment_id, operator_user_id))
    except PaymentServiceError as error:
        _raise_http(error)


@router.post("/{payment_id}/query", response_model=PaymentResponse)
def query_payment(
    payment_id: UUID,
    payload: PaymentQueryRequest,
    db: Session = Depends(get_db),
) -> PaymentResponse:
    try:
        payment = _service(db).query_payment(payment_id, **payload.model_dump())
        db.commit()
        return PaymentResponse.model_validate(payment)
    except PaymentServiceError as error:
        db.rollback()
        _raise_http(error)


@router.post("/{payment_id}/close", response_model=PaymentResponse)
def close_payment(
    payment_id: UUID,
    payload: PaymentCloseRequest,
    db: Session = Depends(get_db),
) -> PaymentResponse:
    try:
        payment = _service(db).close_payment(payment_id, payload.operator_user_id)
        db.commit()
        return PaymentResponse.model_validate(payment)
    except PaymentServiceError as error:
        db.rollback()
        _raise_http(error)


@router.post("/{payment_id}/refund", response_model=RefundCreateResponse)
def refund_payment(
    payment_id: UUID,
    payload: RefundCreateRequest,
    db: Session = Depends(get_db),
) -> RefundCreateResponse:
    try:
        result = _service(db).refund_payment(payment_id, **payload.model_dump())
        db.commit()
        return RefundCreateResponse(
            payment=PaymentResponse.model_validate(result.payment),
            refund=RefundResponse.model_validate(result.refund),
        )
    except PaymentServiceError as error:
        db.rollback()
        _raise_http(error)


@router.post("/{payment_id}/refund/query", response_model=dict[str, Any])
def query_refund(
    payment_id: UUID,
    payload: RefundQueryRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        return _service(db).query_refund(payment_id, **payload.model_dump())
    except PaymentServiceError as error:
        _raise_http(error)


@router.post("/notify", response_model=PaymentResponse)
def notify_payment(payload: PaymentNotifyRequest, db: Session = Depends(get_db)) -> PaymentResponse:
    try:
        service = _service(db)
        verified_notify = service.verify_notify(
            payload.provider,
            headers=payload.headers,
            payload=payload.raw_payload,
            channel=payload.raw_payload.get("channel"),
        )
        payment = service.notify_paid(
            payload.out_trade_no,
            provider_trade_no=payload.provider_trade_no,
            raw_payload={
                **payload.raw_payload,
                "provider": payload.provider,
                "verified_notify": verified_notify,
            },
        )
        db.commit()
        return PaymentResponse.model_validate(payment)
    except PaymentServiceError as error:
        db.rollback()
        _raise_http(error)
