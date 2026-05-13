import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.provider_application import ProviderApplication


class ProviderApplicationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        user_id: uuid.UUID,
        services: list[str],
        base_district: str | None = None,
        intro: str | None = None,
        experience: str | None = None,
        credential_urls: list[str] | None = None,
        status: str = "pending",
    ) -> ProviderApplication:
        application = ProviderApplication(
            user_id=user_id,
            services=services,
            base_district=base_district,
            intro=intro,
            experience=experience,
            credential_urls=credential_urls or [],
            status=status,
        )
        self.db.add(application)
        self.db.flush()
        self.db.refresh(application)
        return application

    def review(
        self,
        application_id: uuid.UUID,
        status: str,
        review_note: str | None = None,
        reviewed_by: uuid.UUID | None = None,
    ) -> ProviderApplication | None:
        application = self.db.get(ProviderApplication, application_id)
        if application is None:
            return None

        application.status = status
        application.review_note = review_note
        application.reviewed_by = reviewed_by
        application.reviewed_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(application)
        return application
