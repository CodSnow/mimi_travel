from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.models.user import User
from app.repositories.address_repo import AddressRepository
from app.repositories.pet_repo import PetRepository
from app.repositories.provider_application_repo import ProviderApplicationRepository
from app.repositories.provider_repo import ProviderRepository
from app.schemas.profile import (
    AddressResponse,
    AddressCreateRequest,
    PetCreateRequest,
    PetResponse,
    ProviderApplicationCreateRequest,
    ProviderApplicationResponse,
    PublicProviderBundleResponse,
    PublicProviderListResponse,
    PublicProviderResponse,
    VehicleProfileResponse,
)


router = APIRouter(dependencies=[Depends(verify_internal_token)])


def _require_user(db: Session, user_id: UUID) -> None:
    if db.get(User, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")


def _provider_response(provider) -> PublicProviderResponse:
    return PublicProviderResponse(
        user_id=provider.user_id,
        nickname=provider.nickname,
        phone=provider.phone,
        avatar=provider.avatar,
        role=provider.role,
        verified=provider.verified,
        status=provider.status,
        services=provider.services,
        intro=provider.intro,
        service_radius_km=provider.service_radius_km,
        base_district=provider.base_district,
        score=provider.score,
        completed_order_count=provider.completed_order_count,
        cat_care_score=provider.cat_care_score,
        communication_score=provider.communication_score,
        punctuality_score=provider.punctuality_score,
        emergency_handling_score=provider.emergency_handling_score,
        pet_friendly_score=provider.pet_friendly_score,
        driving_stability_score=provider.driving_stability_score,
        cleanliness_score=provider.cleanliness_score,
        supports_home_visit=provider.supports_home_visit,
        supports_medication=provider.supports_medication,
        supports_multi_day_care=provider.supports_multi_day_care,
        supports_emergency_order=provider.supports_emergency_order,
        cat_care_tags=provider.cat_care_tags,
    )


def _vehicle_response(vehicle) -> VehicleProfileResponse:
    return VehicleProfileResponse(
        id=vehicle.id,
        user_id=vehicle.user_id,
        vehicle_type=vehicle.vehicle_type,
        plate_masked=vehicle.plate_masked,
        seats=vehicle.seats,
        trunk_level=vehicle.trunk_level,
        supports_cat_bag=vehicle.supports_cat_bag,
        supports_crate=vehicle.supports_crate,
        supports_stroller=vehicle.supports_stroller,
        supports_multi_pet=vehicle.supports_multi_pet,
        pet_friendly=vehicle.pet_friendly,
        pet_friendly_tags=vehicle.pet_friendly_tags,
    )


@router.get("/providers", response_model=PublicProviderListResponse)
def list_public_providers(
    service_type: str | None = None,
    district: str | None = None,
    db: Session = Depends(get_db),
) -> PublicProviderListResponse:
    providers = ProviderRepository(db).list_providers()
    if service_type:
        providers = [provider for provider in providers if service_type in provider.services]
    if district:
        providers = [provider for provider in providers if provider.base_district == district]
    return PublicProviderListResponse(items=[_provider_response(provider) for provider in providers])


@router.get("/providers/{user_id}", response_model=PublicProviderBundleResponse)
def get_public_provider(
    user_id: str,
    db: Session = Depends(get_db),
) -> PublicProviderBundleResponse:
    repo = ProviderRepository(db)
    provider = repo.get_provider(user_id)
    if provider is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="provider not found")
    user = db.get(User, UUID(provider.user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="provider user not found")
    return PublicProviderBundleResponse(
        user=user,
        provider=_provider_response(provider),
        vehicles=[_vehicle_response(vehicle) for vehicle in provider.vehicles],
    )


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


@router.post("/addresses", response_model=AddressResponse)
def create_address(
    payload: AddressCreateRequest,
    db: Session = Depends(get_db),
) -> AddressResponse:
    _require_user(db, payload.user_id)
    address = AddressRepository(db).create(**payload.model_dump())
    db.commit()
    return AddressResponse.model_validate(address)


@router.post("/provider-applications", response_model=ProviderApplicationResponse)
def create_provider_application(
    payload: ProviderApplicationCreateRequest,
    db: Session = Depends(get_db),
) -> ProviderApplicationResponse:
    _require_user(db, payload.user_id)
    application = ProviderApplicationRepository(db).create(**payload.model_dump())
    db.commit()
    return ProviderApplicationResponse.model_validate(application)
