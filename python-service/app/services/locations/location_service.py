import uuid
from dataclasses import dataclass

from app.models.location_snapshot import LocationSnapshot
from app.repositories.location_repo import LocationRepository
from app.repositories.message_repo import MessageRepository
from app.services.messages.message_service import MessageService


class LocationServiceError(ValueError):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class LocationReportResult:
    snapshot: LocationSnapshot
    message_id: uuid.UUID | None = None


class LocationService:
    def __init__(
        self,
        repo: LocationRepository,
        message_repo: MessageRepository,
    ) -> None:
        self.repo = repo
        self.message_repo = message_repo

    def report_location(
        self,
        lat: float,
        lng: float,
        user_id: uuid.UUID,
        order_id: uuid.UUID | None = None,
        address: str | None = None,
        coord_system: str = "gcj02",
    ) -> LocationReportResult:
        if coord_system not in {"gcj02", "wgs84", "bd09ll"}:
            raise LocationServiceError("unsupported coord system", status_code=422)
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            raise LocationServiceError("invalid location coordinates", status_code=422)

        if order_id is not None:
            order = self.repo.get_order(order_id)
            if order is None:
                raise LocationServiceError("order not found", status_code=404)
            if user_id not in {order.buyer_user_id, order.seller_user_id}:
                raise LocationServiceError("order access denied", status_code=403)

        snapshot = self.repo.create_snapshot(
            order_id=order_id,
            user_id=user_id,
            lat=lat,
            lng=lng,
            address=address,
            coord_system=coord_system,
        )

        message_id = None
        if order_id is not None:
            message = MessageService(self.message_repo).send_order_message(
                order_id=order_id,
                sender_user_id=user_id,
                message_type="location",
                content=address or "已更新当前位置",
                payload={
                    "locationId": str(snapshot.id),
                    "lat": float(snapshot.lat),
                    "lng": float(snapshot.lng),
                    "address": snapshot.address,
                    "coordSystem": snapshot.coord_system,
                },
            )
            message_id = message.id

        return LocationReportResult(snapshot=snapshot, message_id=message_id)

    def list_order_locations(
        self,
        order_id: uuid.UUID,
        operator_user_id: uuid.UUID,
        limit: int = 20,
    ) -> list[LocationSnapshot]:
        order = self.repo.get_order(order_id)
        if order is None:
            raise LocationServiceError("order not found", status_code=404)
        if operator_user_id not in {order.buyer_user_id, order.seller_user_id}:
            raise LocationServiceError("order access denied", status_code=403)
        return self.repo.list_order_locations(order_id, limit=limit)
