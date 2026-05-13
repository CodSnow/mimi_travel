from app.repositories.projections import ProviderProjection
from app.schemas.matching import CaregiverMatchDemandDTO


CAREGIVER_MAX_DISTANCE_KM = 20.0
CAREGIVER_WEIGHTS = {
    "distance": 0.18,
    "schedule": 0.08,
    "capability": 0.22,
    "cat_care": 0.16,
    "punctuality": 0.12,
    "communication": 0.10,
    "feedback": 0.06,
    "medication": 0.04,
    "multi_pet": 0.04,
    "price": 0.10,
}


def caregiver_hard_filter_reasons(
    provider: ProviderProjection,
    demand: CaregiverMatchDemandDTO,
    provider_cat_care_score: float | None,
) -> list[str]:
    reasons: list[str] = []
    care = demand.care_requirements

    if care is None:
        return reasons

    if care.need_home_visit and not provider.supports_home_visit:
        reasons.append("provider_not_support_home_visit")
    if care.need_medication and not provider.supports_medication:
        reasons.append("provider_not_support_medication")
    if care.need_multi_day_care and not provider.supports_multi_day_care:
        reasons.append("provider_not_support_multi_day_care")

    if care.require_cat_care_experience:
        qualified_score = (provider_cat_care_score or 0) >= 4.5
        qualified_tags = any(tag in {"多猫家庭", "喂药熟练", "拍照细致"} for tag in provider.cat_care_tags)
        if not qualified_score and not qualified_tags:
            reasons.append("provider_cat_care_experience_insufficient")

    return reasons
