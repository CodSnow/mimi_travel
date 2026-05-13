import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.pet import Pet


class PetRepository:
    _UPDATE_FIELDS = {"name", "breed", "weight", "vaccine", "certificate", "avatar"}

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        user_id: uuid.UUID,
        name: str,
        breed: str | None = None,
        weight: str | None = None,
        vaccine: str | None = None,
        certificate: str | None = None,
        avatar: str | None = None,
    ) -> Pet:
        pet = Pet(
            user_id=user_id,
            name=name,
            breed=breed,
            weight=weight,
            vaccine=vaccine,
            certificate=certificate,
            avatar=avatar,
        )
        self.db.add(pet)
        self.db.flush()
        self.db.refresh(pet)
        return pet

    def list_by_user(self, user_id: uuid.UUID) -> list[Pet]:
        stmt = select(Pet).where(Pet.user_id == user_id).order_by(Pet.created_at, Pet.id)
        return list(self.db.execute(stmt).scalars().all())

    def update(self, pet_id: uuid.UUID, **fields: object) -> Pet | None:
        pet = self.db.get(Pet, pet_id)
        if pet is None:
            return None

        for field_name, value in fields.items():
            if field_name in self._UPDATE_FIELDS:
                setattr(pet, field_name, value)

        self.db.flush()
        self.db.refresh(pet)
        return pet
