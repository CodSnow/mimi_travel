from app.repositories.projections import ProviderProjection, VehicleProjection
from app.schemas.matching import DriverMatchDemandDTO


DRIVER_MAX_DISTANCE_KM = 25.0
DRIVER_WEIGHTS = {
    "distance": 0.16,
    "eta": 0.14,
    "pet_friendly": 0.16,
    "driving_stability": 0.12,
    "cleanliness": 0.10,
    "punctuality": 0.10,
    "experience": 0.08,
    "fit": 0.08,
    "price": 0.06,
}


def driver_hard_filter_reasons(
    provider: ProviderProjection,
    vehicle: VehicleProjection,
    demand: DriverMatchDemandDTO,
) -> list[str]:
    reasons: list[str] = []
    ride = demand.ride_requirements

    if ride is None:
        return reasons

    if ride.require_pet_friendly_vehicle and not vehicle.pet_friendly:
        reasons.append("vehicle_not_pet_friendly")
    if ride.carrier_type == "cat_bag" and not vehicle.supports_cat_bag:
        reasons.append("vehicle_not_support_cat_bag")
    if ride.carrier_type == "crate" and not vehicle.supports_crate:
        reasons.append("vehicle_not_support_crate")
    if ride.carrier_type == "stroller" and not vehicle.supports_stroller:
        reasons.append("vehicle_not_support_stroller")
    if (ride.pet_count or 1) > 1 and not vehicle.supports_multi_pet:
        reasons.append("vehicle_not_support_multi_pet")
    if ride.require_large_trunk and vehicle.trunk_level != "large":
        reasons.append("vehicle_trunk_not_large")
    if ride.require_stable_driving and (provider.driving_stability_score or 0) < 4.4:
        reasons.append("driver_stability_score_low")
    if ride.require_low_odor and (provider.cleanliness_score or 0) < 4.3:
        reasons.append("driver_cleanliness_score_low")

    return reasons
