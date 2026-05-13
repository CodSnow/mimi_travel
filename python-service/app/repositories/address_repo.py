import uuid

from sqlalchemy import desc, select, update
from sqlalchemy.orm import Session

from app.models.address import Address


class AddressRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        user_id: uuid.UUID,
        label: str,
        address: str,
        contact_name: str | None = None,
        contact_phone: str | None = None,
        district: str | None = None,
        lat: float | None = None,
        lng: float | None = None,
        coord_system: str = "gcj02",
        is_default: bool = False,
    ) -> Address:
        if is_default:
            self.db.execute(
                update(Address)
                .where(Address.user_id == user_id, Address.is_default.is_(True))
                .values(is_default=False)
            )

        address_record = Address(
            user_id=user_id,
            label=label,
            contact_name=contact_name,
            contact_phone=contact_phone,
            district=district,
            address=address,
            lat=lat,
            lng=lng,
            coord_system=coord_system,
            is_default=is_default,
        )
        self.db.add(address_record)
        self.db.flush()
        self.db.refresh(address_record)
        return address_record

    def list_by_user(self, user_id: uuid.UUID) -> list[Address]:
        stmt = (
            select(Address)
            .where(Address.user_id == user_id)
            .order_by(desc(Address.is_default), Address.created_at, Address.id)
        )
        return list(self.db.execute(stmt).scalars().all())

    def set_default(self, address_id: uuid.UUID) -> Address | None:
        address = self.db.get(Address, address_id)
        if address is None:
            return None

        self.db.execute(
            update(Address)
            .where(Address.user_id == address.user_id, Address.id != address.id)
            .values(is_default=False)
        )
        address.is_default = True
        self.db.flush()
        self.db.refresh(address)
        return address
