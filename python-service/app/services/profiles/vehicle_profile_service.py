from app.repositories.projections import ProviderProjection, VehicleProjection
from app.schemas.order import DriverSnapshotDTO


class VehicleProfileService:
    def build_driver_snapshot(
        self,
        provider: ProviderProjection,
        vehicle: VehicleProjection | None,
    ) -> DriverSnapshotDTO:
        return DriverSnapshotDTO(
            user_id=provider.user_id,
            nickname=provider.nickname,
            avatar=provider.avatar,
            pet_friendly_score=provider.pet_friendly_score,
            tags=(vehicle.pet_friendly_tags if vehicle else []) or provider.cat_care_tags,
            vehicle_type=vehicle.vehicle_type if vehicle else None,
        )
