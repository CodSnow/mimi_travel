import pytest

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
