import uuid

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.location_snapshot import LocationSnapshot
from app.models.order import Order


class LocationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_order(self, order_id: uuid.UUID) -> Order | None:
        return self.db.get(Order, order_id)

    def create_snapshot(
        self,
        lat: float,
        lng: float,
        order_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
        address: str | None = None,
        coord_system: str = "gcj02",
    ) -> LocationSnapshot:
        snapshot = LocationSnapshot(
            order_id=order_id,
            user_id=user_id,
            lat=lat,
            lng=lng,
            address=address,
            coord_system=coord_system,
        )
        self.db.add(snapshot)
        self.db.flush()
        self.db.refresh(snapshot)
        return snapshot

    def list_order_locations(self, order_id: uuid.UUID, limit: int = 20) -> list[LocationSnapshot]:
        stmt = (
            select(LocationSnapshot)
            .where(LocationSnapshot.order_id == order_id)
            .order_by(desc(LocationSnapshot.created_at), desc(LocationSnapshot.id))
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())
