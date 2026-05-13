from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.seed import load_sample_providers
from app.models.provider_profile import ProviderProfile
from app.models.user import User
from app.models.vehicle_profile import VehicleProfile
from app.repositories.projections import ProviderProjection, VehicleProjection


def _to_float(value: Decimal | float | None) -> float | None:
    if value is None:
        return None
    return float(value)


def _safe_uuid(value: str) -> UUID | None:
    try:
        return UUID(value)
    except ValueError:
        return None


class ProviderRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_providers(self) -> list[ProviderProjection]:
        try:
            providers = self._list_from_db()
            return providers or load_sample_providers()
        except SQLAlchemyError:
            return load_sample_providers()

    def get_provider(self, provider_user_id: str) -> ProviderProjection | None:
        target_id = _safe_uuid(provider_user_id)
        try:
            if target_id is not None:
                provider = self._get_from_db(target_id)
                if provider is not None:
                    return provider
        except SQLAlchemyError:
            pass

        for provider in load_sample_providers():
            if provider.user_id == provider_user_id:
                return provider
        return None

    def get_vehicle(self, provider_user_id: str, vehicle_id: str | None = None) -> VehicleProjection | None:
        provider = self.get_provider(provider_user_id)
        if provider is None or not provider.vehicles:
            return None

        if vehicle_id is None:
            return provider.vehicles[0]

        for vehicle in provider.vehicles:
            if vehicle.id == vehicle_id:
                return vehicle
        return None

    def _list_from_db(self) -> list[ProviderProjection]:
        stmt = (
            select(User, ProviderProfile)
            .join(ProviderProfile, ProviderProfile.user_id == User.id)
            .where(ProviderProfile.status == "approved")
        )
        rows = self.db.execute(stmt).all()
        if not rows:
            return []

        vehicle_rows = self.db.execute(select(VehicleProfile)).scalars().all()
        vehicles_by_user: dict[str, list[VehicleProjection]] = {}
        for vehicle in vehicle_rows:
            vehicles_by_user.setdefault(str(vehicle.user_id), []).append(
                VehicleProjection(
                    id=str(vehicle.id),
                    user_id=str(vehicle.user_id),
                    vehicle_type=vehicle.vehicle_type,
                    plate_masked=vehicle.plate_masked,
                    seats=vehicle.seats,
                    trunk_level=vehicle.trunk_level,
                    supports_cat_bag=vehicle.supports_cat_bag,
                    supports_crate=vehicle.supports_crate,
                    supports_stroller=vehicle.supports_stroller,
                    supports_multi_pet=vehicle.supports_multi_pet,
                    pet_friendly=vehicle.pet_friendly,
                    pet_friendly_tags=list(vehicle.pet_friendly_tags or []),
                )
            )

        return [self._map_provider(user, profile, vehicles_by_user.get(str(user.id), [])) for user, profile in rows]

    def _get_from_db(self, provider_user_id: UUID) -> ProviderProjection | None:
        stmt = (
            select(User, ProviderProfile)
            .join(ProviderProfile, ProviderProfile.user_id == User.id)
            .where(ProviderProfile.user_id == provider_user_id)
        )
        row = self.db.execute(stmt).first()
        if row is None:
            return None

        vehicles = self.db.execute(
            select(VehicleProfile).where(VehicleProfile.user_id == provider_user_id)
        ).scalars().all()
        mapped_vehicles = [
            VehicleProjection(
                id=str(vehicle.id),
                user_id=str(vehicle.user_id),
                vehicle_type=vehicle.vehicle_type,
                plate_masked=vehicle.plate_masked,
                seats=vehicle.seats,
                trunk_level=vehicle.trunk_level,
                supports_cat_bag=vehicle.supports_cat_bag,
                supports_crate=vehicle.supports_crate,
                supports_stroller=vehicle.supports_stroller,
                supports_multi_pet=vehicle.supports_multi_pet,
                pet_friendly=vehicle.pet_friendly,
                pet_friendly_tags=list(vehicle.pet_friendly_tags or []),
            )
            for vehicle in vehicles
        ]
        return self._map_provider(row[0], row[1], mapped_vehicles)

    def _map_provider(
        self,
        user: User,
        profile: ProviderProfile,
        vehicles: list[VehicleProjection],
    ) -> ProviderProjection:
        return ProviderProjection(
            user_id=str(user.id),
            nickname=user.nickname,
            phone=user.phone,
            avatar=user.avatar,
            role=user.role,
            verified=user.verified,
            status=profile.status,
            services=list(profile.services or []),
            intro=profile.intro,
            service_radius_km=profile.service_radius_km,
            base_district=profile.base_district,
            score=_to_float(profile.score),
            completed_order_count=profile.completed_order_count,
            cat_care_score=_to_float(profile.cat_care_score),
            communication_score=_to_float(profile.communication_score),
            punctuality_score=_to_float(profile.punctuality_score),
            emergency_handling_score=_to_float(profile.emergency_handling_score),
            pet_friendly_score=_to_float(profile.pet_friendly_score),
            driving_stability_score=_to_float(profile.driving_stability_score),
            cleanliness_score=_to_float(profile.cleanliness_score),
            supports_home_visit=profile.supports_home_visit,
            supports_medication=profile.supports_medication,
            supports_multi_day_care=profile.supports_multi_day_care,
            supports_emergency_order=profile.supports_emergency_order,
            cat_care_tags=list(profile.cat_care_tags or []),
            vehicles=vehicles,
        )
