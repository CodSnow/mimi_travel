from types import MappingProxyType
from typing import Mapping


class OrderStateError(ValueError):
    pass


class OrderStateService:
    transitions: Mapping[str, Mapping[str, str]] = MappingProxyType(
        {
            "confirm_arrival": MappingProxyType({"paid": "arriving", "confirmed": "arriving"}),
            "start_service": MappingProxyType({"paid": "serving", "confirmed": "serving", "arriving": "serving"}),
            "complete": MappingProxyType(
                {
                    "paid": "completed",
                    "confirmed": "completed",
                    "arriving": "completed",
                    "serving": "completed",
                }
            ),
            "cancel": MappingProxyType(
                {
                    "pending_payment": "cancelled",
                    "paid": "cancelled",
                    "confirmed": "cancelled",
                    "arriving": "cancelled",
                    "serving": "cancelled",
                }
            ),
            "request_refund": MappingProxyType(
                {"paid": "refund_pending", "confirmed": "refund_pending", "cancelled": "refund_pending"}
            ),
            "mark_refunded": MappingProxyType({"refund_pending": "refunded"}),
        }
    )

    def next_status(self, current_status: str, action: str) -> str:
        action_transitions = self.transitions.get(action)
        if action_transitions is None or current_status not in action_transitions:
            raise OrderStateError(f"order status {current_status} can not perform {action}")
        return action_transitions[current_status]
