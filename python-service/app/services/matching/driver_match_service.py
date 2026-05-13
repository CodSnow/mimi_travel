from app.repositories.provider_repo import ProviderRepository
from app.rules.driver_rules import DRIVER_MAX_DISTANCE_KM, DRIVER_WEIGHTS, driver_hard_filter_reasons
from app.schemas.matching import (
    DriverMatchCandidateDTO,
    DriverMatchRequest,
    DriverMatchResponse,
    DriverProfileSnapshotDTO,
    VehicleSnapshotDTO,
)
from app.services.matching.scoring import (
    eta_score,
    inverse_distance_score,
    price_alignment_score,
    rating_to_score,
    weighted_score,
)
from app.services.reviews.provider_review_summary_service import ProviderReviewSummaryService
from app.utils.geo import approximate_distance_km
from app.utils.pagination import paginate_items


class DriverMatchService:
    def __init__(
        self,
        provider_repo: ProviderRepository,
        review_summary_service: ProviderReviewSummaryService,
    ) -> None:
        self.provider_repo = provider_repo
        self.review_summary_service = review_summary_service

    def match(self, payload: DriverMatchRequest) -> DriverMatchResponse:
        candidates: list[DriverMatchCandidateDTO] = []

        for provider in self.provider_repo.list_providers():
            if provider.status != "approved":
                continue
            if not any(service in provider.services for service in {"taxi", "ride", "pet_friendly_taxi", "carpool", "escort"}):
                continue
            if not provider.vehicles:
                continue

            summary = self.review_summary_service.summarize(payload.meta.request_id, provider.user_id)
            vehicle = provider.vehicles[0]
            filter_reasons = driver_hard_filter_reasons(provider, vehicle, payload.demand)
            if filter_reasons:
                continue

            distance_km = approximate_distance_km(
                payload.demand.pickup.lat if payload.demand.pickup else None,
                payload.demand.pickup.lng if payload.demand.pickup else None,
                provider.lat,
                provider.lng,
                payload.demand.district == provider.base_district,
            )
            if distance_km > DRIVER_MAX_DISTANCE_KM:
                continue

            eta_minutes = max(6, int(distance_km * 4.5 + 4))
            quote_min = int(payload.demand.budget_min * 0.92)
            quote_max = int(payload.demand.budget_max * 1.08)

            ride = payload.demand.ride_requirements
            fit_score = 72.0
            if ride:
                fit_score = 60.0
                if ride.require_pet_friendly_vehicle and vehicle.pet_friendly:
                    fit_score += 12
                if ride.require_large_trunk and vehicle.trunk_level == "large":
                    fit_score += 12
                if (ride.pet_count or 1) > 1 and vehicle.supports_multi_pet:
                    fit_score += 10
                if ride.carrier_type == "crate" and vehicle.supports_crate:
                    fit_score += 8
                if ride.carrier_type == "cat_bag" and vehicle.supports_cat_bag:
                    fit_score += 8

            parts = {
                "distance": inverse_distance_score(distance_km, DRIVER_MAX_DISTANCE_KM),
                "eta": eta_score(eta_minutes),
                "pet_friendly": rating_to_score(summary.pet_friendly_score or provider.pet_friendly_score),
                "driving_stability": rating_to_score(summary.driving_stability_score or provider.driving_stability_score),
                "cleanliness": rating_to_score(summary.cleanliness_score or provider.cleanliness_score),
                "punctuality": rating_to_score(summary.punctuality_score or provider.punctuality_score),
                "experience": min(100.0, 45 + provider.completed_order_count / 3),
                "fit": min(100.0, fit_score),
                "price": price_alignment_score(payload.demand.budget_min, payload.demand.budget_max, quote_min, quote_max),
            }
            score = weighted_score(parts, DRIVER_WEIGHTS)

            reasons: list[str] = []
            if vehicle.pet_friendly:
                reasons.append("车辆已开启宠物友好")
            if vehicle.trunk_level == "large":
                reasons.append("后备箱空间更充足")
            if (summary.pet_friendly_score or provider.pet_friendly_score or 0) >= 4.7:
                reasons.append("宠物友好评分高")
            if vehicle.supports_multi_pet:
                reasons.append("支持多宠同行")
            if not reasons:
                reasons.append("满足当前出行条件")

            candidates.append(
                DriverMatchCandidateDTO(
                    provider_user_id=provider.user_id,
                    vehicle_id=vehicle.id,
                    score=score,
                    distance_km=distance_km,
                    eta_minutes=eta_minutes,
                    reasons=reasons,
                    profile_snapshot=DriverProfileSnapshotDTO(
                        nickname=provider.nickname,
                        avatar=provider.avatar,
                        pet_friendly_score=summary.pet_friendly_score or provider.pet_friendly_score,
                        driving_stability_score=summary.driving_stability_score or provider.driving_stability_score,
                        cleanliness_score=summary.cleanliness_score or provider.cleanliness_score,
                        punctuality_score=summary.punctuality_score or provider.punctuality_score,
                        tags=vehicle.pet_friendly_tags or provider.cat_care_tags,
                        completed_order_count=provider.completed_order_count,
                    ),
                    vehicle_snapshot=VehicleSnapshotDTO(
                        vehicle_type=vehicle.vehicle_type,
                        trunk_level=vehicle.trunk_level,
                        supports_cat_bag=vehicle.supports_cat_bag,
                        supports_crate=vehicle.supports_crate,
                        supports_stroller=vehicle.supports_stroller,
                        supports_multi_pet=vehicle.supports_multi_pet,
                        pet_friendly=vehicle.pet_friendly,
                        pet_friendly_tags=vehicle.pet_friendly_tags,
                    ),
                )
            )

        candidates.sort(key=lambda item: item.score, reverse=True)
        return DriverMatchResponse(
            request_id=payload.meta.request_id,
            candidates=paginate_items(candidates, payload.page, payload.page_size),
        )
