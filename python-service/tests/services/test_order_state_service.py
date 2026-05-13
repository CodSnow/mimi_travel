import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.services.identity.session_service import SessionService
from app.services.orders.order_state_service import OrderStateError, OrderStateService


def test_paid_order_can_start_and_complete():
    service = OrderStateService()
    assert service.next_status("paid", "confirm_arrival") == "arriving"
    assert service.next_status("arriving", "start_service") == "serving"
    assert service.next_status("serving", "complete") == "completed"


def test_pending_payment_cannot_start_service():
    service = OrderStateService()
    with pytest.raises(OrderStateError):
        service.next_status("pending_payment", "start_service")


def test_completed_order_cannot_cancel():
    service = OrderStateService()
    with pytest.raises(OrderStateError):
        service.next_status("completed", "cancel")


def test_order_state_transitions_are_immutable():
    service = OrderStateService()
    with pytest.raises(TypeError):
        service.transitions["complete"]["paid"] = "broken"


def test_hash_token_returns_sha256_hex_digest():
    service = SessionService(user_repo=SimpleNamespace())
    token = "mimi-travel-token"
    assert service.hash_token(token) == hashlib.sha256(token.encode("utf-8")).hexdigest()


def test_create_login_session_persists_hashed_token_and_expiration():
    calls = {}

    def create_session(**kwargs):
        calls.update(kwargs)
        return SimpleNamespace(**kwargs)

    user_repo = SimpleNamespace(create_session=create_session)
    service = SessionService(user_repo=user_repo)

    started_at = datetime.now(timezone.utc)
    user_id = uuid.uuid4()
    token, session = service.create_login_session(user_id=user_id)
    finished_at = datetime.now(timezone.utc)

    assert token
    assert calls["user_id"] == user_id
    assert calls["token_hash"] == hashlib.sha256(token.encode("utf-8")).hexdigest()
    assert session.token_hash == calls["token_hash"]
    assert session.expires_at.tzinfo is not None
    expected_start = started_at + timedelta(days=14)
    expected_end = finished_at + timedelta(days=14)
    assert expected_start <= session.expires_at <= expected_end
