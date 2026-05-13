from app.repositories.provider_repo import ProviderRepository
from app.rules.caregiver_rules import (
    CAREGIVER_MAX_DISTANCE_KM,
    CAREGIVER_WEIGHTS,
    caregiver_hard_filter_reasons,
)
from app.schemas.matching import (
    CaregiverMatchCandidateDTO,
    CaregiverMatchRequest,
    CaregiverMatchResponse,
    CaregiverProfileSnapshotDTO,
)
from app.services.matching.scoring import (
    inverse_distance_score,
    price_alignment_score,
    rating_to_score,
    weighted_score,
)
from app.services.reviews.provider_review_summary_service import ProviderReviewSummaryService
from app.utils.geo import approximate_distance_km
from app.utils.pagination import paginate_items


class CaregiverMatchService:
    def __init__(
        self,
        provider_repo: ProviderRepository,
        review_summary_service: ProviderReviewSummaryService,
    ) -> None:
        self.provider_repo = provider_repo
        self.review_summary_service = review_summary_service

    def match(self, payload: CaregiverMatchRequest) -> CaregiverMatchResponse:
        candidates: list[CaregiverMatchCandidateDTO] = []

        for provider in self.provider_repo.list_providers():
            if provider.status != "approved":
                continue
            if not any(
                service in provider.services
                for service in {"buddy", "feeding", "cleaning", "playtime", "temporary_care", "hospital", "medication", "multi_day_care", "grooming_pickup"}
            ):
                continue

            summary = self.review_summary_service.summarize(payload.meta.request_id, provider.user_id)
            filter_reasons = caregiver_hard_filter_reasons(
                provider,
                payload.demand,
                summary.cat_care_score or provider.cat_care_score,
            )
            if filter_reasons:
                continue

            distance_km = approximate_distance_km(
                payload.demand.pickup.lat if payload.demand.pickup else None,
                payload.demand.pickup.lng if payload.demand.pickup else None,
                provider.lat,
                provider.lng,
                payload.demand.district == provider.base_district,
            )
            if distance_km > max(provider.service_radius_km, CAREGIVER_MAX_DISTANCE_KM):
                continue

            quote_min = int(payload.demand.budget_min * 0.9)
            quote_max = int(payload.demand.budget_max * 1.05)

            care = payload.demand.care_requirements
            capability_score = 70.0
            if care:
                capability_score = 60.0
                if care.need_home_visit and provider.supports_home_visit:
                    capability_score += 12
                if care.need_medication and provider.supports_medication:
                    capability_score += 14
                if care.need_multi_day_care and provider.supports_multi_day_care:
                    capability_score += 10
                if care.require_cat_care_experience and (summary.cat_care_score or provider.cat_care_score or 0) >= 4.6:
                    capability_score += 8

            parts = {
                "distance": inverse_distance_score(distance_km, CAREGIVER_MAX_DISTANCE_KM),
                "schedule": 80.0,
                "capability": min(capability_score, 100.0),
                "cat_care": rating_to_score(summary.cat_care_score or provider.cat_care_score),
                "punctuality": rating_to_score(summary.punctuality_score or provider.punctuality_score),
                "communication": rating_to_score(summary.communication_score or provider.communication_score),
                "feedback": rating_to_score(summary.feedback_completeness_score, default=65.0),
                "medication": 100.0 if not care or not care.need_medication or provider.supports_medication else 40.0,
                "multi_pet": 95.0 if care and care.has_multiple_pets and "多猫家庭" in provider.cat_care_tags else 72.0,
                "price": price_alignment_score(payload.demand.budget_min, payload.demand.budget_max, quote_min, quote_max),
            }
            score = weighted_score(parts, CAREGIVER_WEIGHTS)

            reasons: list[str] = []
            if distance_km <= 3:
                reasons.append("距离近，响应更快")
            if (summary.cat_care_score or provider.cat_care_score or 0) >= 4.7:
                reasons.append("猫咪照护评分高")
            if care and care.need_medication and provider.supports_medication:
                reasons.append("支持喂药服务")
            if "多猫家庭" in provider.cat_care_tags:
                reasons.append("有多猫家庭经验")
            if not reasons:
                reasons.append("基础能力匹配当前需求")

            candidates.append(
                CaregiverMatchCandidateDTO(
                    provider_user_id=provider.user_id,
                    score=score,
                    distance_km=distance_km,
                    reasons=reasons,
                    price_hint_min=quote_min,
                    price_hint_max=quote_max,
                    profile_snapshot=CaregiverProfileSnapshotDTO(
                        nickname=provider.nickname,
                        avatar=provider.avatar,
                        cat_care_score=summary.cat_care_score or provider.cat_care_score,
                        communication_score=summary.communication_score or provider.communication_score,
                        punctuality_score=summary.punctuality_score or provider.punctuality_score,
                        tags=provider.cat_care_tags,
                        completed_order_count=provider.completed_order_count,
                        supports_home_visit=provider.supports_home_visit,
                        supports_medication=provider.supports_medication,
                        supports_multi_day_care=provider.supports_multi_day_care,
                    ),
                )
            )

        candidates.sort(key=lambda item: item.score, reverse=True)
        return CaregiverMatchResponse(
            request_id=payload.meta.request_id,
            candidates=paginate_items(candidates, payload.page, payload.page_size),
        )
