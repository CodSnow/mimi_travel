from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.models.user import User
from app.repositories.address_repo import AddressRepository
from app.repositories.pet_repo import PetRepository
from app.repositories.provider_application_repo import ProviderApplicationRepository
from app.schemas.profile import (
    AddressResponse,
    PetCreateRequest,
    PetResponse,
    ProviderApplicationCreateRequest,
    ProviderApplicationResponse,
)


router = APIRouter(dependencies=[Depends(verify_internal_token)])


def _require_user(db: Session, user_id: UUID) -> None:
    if db.get(User, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")


@router.get("/pets", response_model=list[PetResponse])
def list_pets(
    user_id: UUID,
    db: Session = Depends(get_db),
) -> list[PetResponse]:
    pets = PetRepository(db).list_by_user(user_id=user_id)
    return [PetResponse.model_validate(pet) for pet in pets]


@router.post("/pets", response_model=PetResponse)
def create_pet(
    payload: PetCreateRequest,
    db: Session = Depends(get_db),
) -> PetResponse:
    _require_user(db, payload.user_id)
    pet = PetRepository(db).create(**payload.model_dump())
    db.commit()
    return PetResponse.model_validate(pet)


@router.get("/addresses", response_model=list[AddressResponse])
def list_addresses(
    user_id: UUID,
    db: Session = Depends(get_db),
) -> list[AddressResponse]:
    addresses = AddressRepository(db).list_by_user(user_id=user_id)
    return [AddressResponse.model_validate(address) for address in addresses]


@router.post("/provider-applications", response_model=ProviderApplicationResponse)
def create_provider_application(
    payload: ProviderApplicationCreateRequest,
    db: Session = Depends(get_db),
) -> ProviderApplicationResponse:
    _require_user(db, payload.user_id)
    application = ProviderApplicationRepository(db).create(**payload.model_dump())
    db.commit()
    return ProviderApplicationResponse.model_validate(application)
