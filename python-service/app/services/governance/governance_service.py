import uuid
from dataclasses import dataclass

from app.models.complaint import Complaint
from app.models.dispute import Dispute
from app.models.provider_application import ProviderApplication
from app.models.provider_profile import ProviderProfile
from app.repositories.governance_repo import GovernanceRepository


class GovernanceServiceError(ValueError):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class ReviewProviderApplicationResult:
    application: ProviderApplication
    provider: ProviderProfile | None = None


class GovernanceService:
    def __init__(self, repo: GovernanceRepository) -> None:
        self.repo = repo

    def require_admin(self, admin_user_id: uuid.UUID) -> None:
        user = self.repo.get_user(admin_user_id)
        if user is None:
            raise GovernanceServiceError("admin user not found", status_code=404)
        if user.role != "admin":
            raise GovernanceServiceError("admin role required", status_code=403)

    def list_provider_applications(self, admin_user_id: uuid.UUID, status: str | None = None) -> list[ProviderApplication]:
        self.require_admin(admin_user_id)
        return self.repo.list_provider_applications(status)

    def review_provider_application(
        self,
        application_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        status: str,
        review_note: str | None = None,
    ) -> ReviewProviderApplicationResult:
        self.require_admin(admin_user_id)
        if status not in {"approved", "rejected"}:
            raise GovernanceServiceError("unsupported provider application status", status_code=422)
        application = self.repo.get_provider_application(application_id)
        if application is None:
            raise GovernanceServiceError("provider application not found", status_code=404)
        application.status = status
        application.review_note = review_note
        application.reviewed_by = admin_user_id
        provider = self.repo.upsert_provider_profile_from_application(application) if status == "approved" else None
        self.repo.create_audit_log(
            admin_user_id,
            "review_provider_application",
            "provider_application",
            str(application.id),
            {"status": status, "reviewNote": review_note},
        )
        self.repo.db.flush()
        self.repo.db.refresh(application)
        return ReviewProviderApplicationResult(application=application, provider=provider)

    def create_complaint(
        self,
        complainant_user_id: uuid.UUID,
        category: str,
        content: str,
        order_id: uuid.UUID | None = None,
        target_user_id: uuid.UUID | None = None,
        evidence_urls: list[str] | None = None,
    ) -> Complaint:
        if self.repo.get_user(complainant_user_id) is None:
            raise GovernanceServiceError("complainant user not found", status_code=404)
        return self.repo.create_complaint(
            complainant_user_id=complainant_user_id,
            category=category,
            content=content,
            order_id=order_id,
            target_user_id=target_user_id,
            evidence_urls=evidence_urls,
        )

    def handle_complaint(
        self,
        complaint_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        status: str,
        resolution: str,
    ) -> Complaint:
        self.require_admin(admin_user_id)
        complaint = self.repo.get_complaint(complaint_id)
        if complaint is None:
            raise GovernanceServiceError("complaint not found", status_code=404)
        complaint.status = status
        complaint.resolution = resolution
        complaint.handled_by = admin_user_id
        self.repo.create_audit_log(
            admin_user_id,
            "handle_complaint",
            "complaint",
            str(complaint.id),
            {"status": status, "resolution": resolution},
        )
        self.repo.db.flush()
        self.repo.db.refresh(complaint)
        return complaint

    def create_dispute(
        self,
        order_id: uuid.UUID,
        opener_user_id: uuid.UUID,
        reason: str,
        description: str,
        respondent_user_id: uuid.UUID | None = None,
        requested_refund_fen: int | None = None,
        evidence_urls: list[str] | None = None,
    ) -> Dispute:
        if self.repo.get_user(opener_user_id) is None:
            raise GovernanceServiceError("opener user not found", status_code=404)
        return self.repo.create_dispute(
            order_id=order_id,
            opener_user_id=opener_user_id,
            respondent_user_id=respondent_user_id,
            reason=reason,
            description=description,
            requested_refund_fen=requested_refund_fen,
            evidence_urls=evidence_urls,
        )

    def handle_dispute(
        self,
        dispute_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        status: str,
        resolution: str,
    ) -> Dispute:
        self.require_admin(admin_user_id)
        dispute = self.repo.get_dispute(dispute_id)
        if dispute is None:
            raise GovernanceServiceError("dispute not found", status_code=404)
        dispute.status = status
        dispute.resolution = resolution
        dispute.handled_by = admin_user_id
        self.repo.create_audit_log(
            admin_user_id,
            "handle_dispute",
            "dispute",
            str(dispute.id),
            {"status": status, "resolution": resolution},
        )
        self.repo.db.flush()
        self.repo.db.refresh(dispute)
        return dispute
