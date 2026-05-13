import uuid
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.admin_audit_log import AdminAuditLog
from app.models.complaint import Complaint
from app.models.dispute import Dispute
from app.models.order import Order
from app.models.policy_favorite import PolicyFavorite
from app.models.provider_application import ProviderApplication
from app.models.provider_profile import ProviderProfile
from app.models.refund import Refund
from app.models.user import User


class GovernanceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user(self, user_id: uuid.UUID) -> User | None:
        return self.db.get(User, user_id)

    def list_provider_applications(self, status: str | None = None) -> list[ProviderApplication]:
        stmt = select(ProviderApplication).order_by(desc(ProviderApplication.created_at), ProviderApplication.id)
        if status:
            stmt = stmt.where(ProviderApplication.status == status)
        return list(self.db.execute(stmt).scalars().all())

    def get_provider_application(self, application_id: uuid.UUID) -> ProviderApplication | None:
        return self.db.get(ProviderApplication, application_id)

    def upsert_provider_profile_from_application(self, application: ProviderApplication) -> ProviderProfile:
        profile = self.db.get(ProviderProfile, application.user_id)
        if profile is None:
            profile = ProviderProfile(user_id=application.user_id)
            self.db.add(profile)
        profile.status = "approved"
        profile.services = application.services
        profile.base_district = application.base_district
        profile.intro = application.intro
        profile.accepting_orders = True
        self.db.flush()
        self.db.refresh(profile)
        return profile

    def create_complaint(
        self,
        complainant_user_id: uuid.UUID,
        category: str,
        content: str,
        order_id: uuid.UUID | None = None,
        target_user_id: uuid.UUID | None = None,
        evidence_urls: list[str] | None = None,
    ) -> Complaint:
        complaint = Complaint(
            order_id=order_id,
            complainant_user_id=complainant_user_id,
            target_user_id=target_user_id,
            category=category,
            content=content,
            evidence_urls=evidence_urls or [],
        )
        self.db.add(complaint)
        self.db.flush()
        self.db.refresh(complaint)
        return complaint

    def list_complaints(self, status: str | None = None) -> list[Complaint]:
        stmt = select(Complaint).order_by(desc(Complaint.created_at), Complaint.id)
        if status:
            stmt = stmt.where(Complaint.status == status)
        return list(self.db.execute(stmt).scalars().all())

    def get_complaint(self, complaint_id: uuid.UUID) -> Complaint | None:
        return self.db.get(Complaint, complaint_id)

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
        dispute = Dispute(
            order_id=order_id,
            opener_user_id=opener_user_id,
            respondent_user_id=respondent_user_id,
            reason=reason,
            description=description,
            requested_refund_fen=requested_refund_fen,
            evidence_urls=evidence_urls or [],
        )
        self.db.add(dispute)
        self.db.flush()
        self.db.refresh(dispute)
        return dispute

    def list_disputes(self, status: str | None = None) -> list[Dispute]:
        stmt = select(Dispute).order_by(desc(Dispute.created_at), Dispute.id)
        if status:
            stmt = stmt.where(Dispute.status == status)
        return list(self.db.execute(stmt).scalars().all())

    def get_dispute(self, dispute_id: uuid.UUID) -> Dispute | None:
        return self.db.get(Dispute, dispute_id)

    def list_orders(self) -> list[Order]:
        return list(self.db.execute(select(Order).order_by(desc(Order.updated_at), Order.id)).scalars().all())

    def list_refunds(self) -> list[Refund]:
        return list(self.db.execute(select(Refund).order_by(desc(Refund.created_at), Refund.id)).scalars().all())

    def create_audit_log(
        self,
        admin_user_id: uuid.UUID,
        action: str,
        target_type: str,
        target_id: str,
        payload: dict[str, Any] | None = None,
    ) -> AdminAuditLog:
        log = AdminAuditLog(
            admin_user_id=admin_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            payload=payload,
        )
        self.db.add(log)
        self.db.flush()
        self.db.refresh(log)
        return log

    def list_audit_logs(self, limit: int = 50) -> list[AdminAuditLog]:
        stmt = select(AdminAuditLog).order_by(desc(AdminAuditLog.created_at), AdminAuditLog.id).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def upsert_policy_favorite(
        self,
        user_id: uuid.UUID,
        policy_id: str,
        title: str,
        district: str | None = None,
    ) -> PolicyFavorite:
        stmt = (
            insert(PolicyFavorite)
            .values(user_id=user_id, policy_id=policy_id, title=title, district=district)
            .on_conflict_do_update(
                index_elements=[PolicyFavorite.user_id, PolicyFavorite.policy_id],
                set_={"title": title, "district": district},
            )
            .returning(PolicyFavorite)
        )
        return self.db.execute(stmt.execution_options(populate_existing=True)).scalar_one()

    def delete_policy_favorite(self, user_id: uuid.UUID, policy_id: str) -> bool:
        favorite = self.db.execute(
            select(PolicyFavorite).where(PolicyFavorite.user_id == user_id, PolicyFavorite.policy_id == policy_id)
        ).scalar_one_or_none()
        if favorite is None:
            return False
        self.db.delete(favorite)
        self.db.flush()
        return True

    def list_policy_favorites(self, user_id: uuid.UUID) -> list[PolicyFavorite]:
        stmt = select(PolicyFavorite).where(PolicyFavorite.user_id == user_id).order_by(desc(PolicyFavorite.created_at))
        return list(self.db.execute(stmt).scalars().all())
