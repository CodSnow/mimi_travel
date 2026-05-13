from app.repositories.provider_repo import ProviderRepository
from app.schemas.order import OrderSnapshotRequest, OrderSnapshotResponse
from app.services.profiles.provider_profile_service import ProviderProfileService
from app.services.profiles.vehicle_profile_service import VehicleProfileService


class SnapshotService:
    def __init__(
        self,
        provider_repo: ProviderRepository,
        provider_profile_service: ProviderProfileService,
        vehicle_profile_service: VehicleProfileService,
    ) -> None:
        self.provider_repo = provider_repo
        self.provider_profile_service = provider_profile_service
        self.vehicle_profile_service = vehicle_profile_service

    def build_snapshot(self, payload: OrderSnapshotRequest) -> OrderSnapshotResponse:
        provider = self.provider_repo.get_provider(payload.provider_user_id)
        if provider is None:
            return OrderSnapshotResponse(
                request_id=payload.meta.request_id,
                order_id=payload.order_id,
            )

        vehicle = self.provider_repo.get_vehicle(payload.provider_user_id, payload.vehicle_id)
        is_driver = any(service in provider.services for service in {"taxi", "ride", "pet_friendly_taxi", "carpool", "escort"})
        is_caregiver = any(service in provider.services for service in {"buddy", "feeding", "cleaning", "playtime", "temporary_care", "hospital", "medication", "multi_day_care", "grooming_pickup"})

        return OrderSnapshotResponse(
            request_id=payload.meta.request_id,
            order_id=payload.order_id,
            caregiver_snapshot=self.provider_profile_service.build_caregiver_snapshot(provider) if is_caregiver else None,
            driver_snapshot=self.vehicle_profile_service.build_driver_snapshot(provider, vehicle) if is_driver else None,
        )
