class OrderStateError(ValueError):
    pass


class OrderStateService:
    transitions: dict[str, dict[str, str]] = {
        "confirm_arrival": {"paid": "arriving", "confirmed": "arriving"},
        "start_service": {"paid": "serving", "confirmed": "serving", "arriving": "serving"},
        "complete": {
            "paid": "completed",
            "confirmed": "completed",
            "arriving": "completed",
            "serving": "completed",
        },
        "cancel": {
            "pending_payment": "cancelled",
            "paid": "cancelled",
            "confirmed": "cancelled",
            "arriving": "cancelled",
            "serving": "cancelled",
        },
        "request_refund": {"paid": "refund_pending", "confirmed": "refund_pending", "cancelled": "refund_pending"},
        "mark_refunded": {"refund_pending": "refunded"},
    }

    def next_status(self, current_status: str, action: str) -> str:
        action_transitions = self.transitions.get(action)
        if action_transitions is None or current_status not in action_transitions:
            raise OrderStateError(f"order status {current_status} can not perform {action}")
        return action_transitions[current_status]
