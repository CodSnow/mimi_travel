from app.repositories.projections import ProviderProjection
from app.schemas.order import CaregiverSnapshotDTO


class ProviderProfileService:
    def build_caregiver_snapshot(self, provider: ProviderProjection) -> CaregiverSnapshotDTO:
        return CaregiverSnapshotDTO(
            user_id=provider.user_id,
            nickname=provider.nickname,
            avatar=provider.avatar,
            cat_care_score=provider.cat_care_score,
            tags=provider.cat_care_tags,
            supports_medication=provider.supports_medication,
            supports_multi_day_care=provider.supports_multi_day_care,
        )
