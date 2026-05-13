from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db, verify_internal_token
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
    pet = PetRepository(db).create(**payload.model_dump())
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
    application = ProviderApplicationRepository(db).create(**payload.model_dump())
    return ProviderApplicationResponse.model_validate(application)
