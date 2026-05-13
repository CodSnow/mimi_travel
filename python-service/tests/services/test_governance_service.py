import pytest
from sqlalchemy.orm import Session

from app.repositories.governance_repo import GovernanceRepository
from app.repositories.provider_application_repo import ProviderApplicationRepository
from app.repositories.user_repo import UserRepository
from app.services.governance.governance_service import GovernanceService, GovernanceServiceError


@pytest.fixture
def admin(db: Session):
    user = UserRepository(db).upsert_by_phone("13960000001", "管理员", "admin")
    user.role = "admin"
    db.flush()
    return user


@pytest.fixture
def customer(db: Session):
    return UserRepository(db).upsert_by_phone("13960000002", "用户", "cat")


def test_admin_reviews_provider_application_and_writes_audit(db: Session, admin, customer):
    application = ProviderApplicationRepository(db).create(
        user_id=customer.id,
        services=["buddy", "ride"],
        base_district="拱墅区",
        intro="可上门照护",
    )

    result = GovernanceService(GovernanceRepository(db)).review_provider_application(
        application.id,
        admin_user_id=admin.id,
        status="approved",
        review_note="资料完整",
    )

    assert result.application.status == "approved"
    assert result.provider.status == "approved"
    assert result.provider.accepting_orders is True
    assert GovernanceRepository(db).list_audit_logs()[0].action == "review_provider_application"


def test_non_admin_can_not_review_application(db: Session, customer):
    with pytest.raises(GovernanceServiceError, match="admin role required"):
        GovernanceService(GovernanceRepository(db)).list_provider_applications(customer.id)


def test_create_and_handle_complaint_and_dispute(db: Session, admin, customer):
    service = GovernanceService(GovernanceRepository(db))

    complaint = service.create_complaint(
        complainant_user_id=customer.id,
        category="service_quality",
        content="服务迟到",
    )
    handled_complaint = service.handle_complaint(
        complaint.id,
        admin_user_id=admin.id,
        status="resolved",
        resolution="已提醒服务者",
    )

    assert handled_complaint.status == "resolved"
    assert handled_complaint.handled_by == admin.id

    dispute = service.create_dispute(
        order_id=complaint.id,
        opener_user_id=customer.id,
        reason="refund",
        description="申请退款",
        requested_refund_fen=3000,
    )
    handled_dispute = service.handle_dispute(
        dispute.id,
        admin_user_id=admin.id,
        status="resolved",
        resolution="同意部分退款",
    )

    assert handled_dispute.status == "resolved"
    assert handled_dispute.resolution == "同意部分退款"


def test_policy_favorite_upsert_and_delete(db: Session, customer):
    repo = GovernanceRepository(db)

    favorite = repo.upsert_policy_favorite(
        user_id=customer.id,
        policy_id="hz-cert",
        title="杭州检疫证明",
        district="拱墅区",
    )
    again = repo.upsert_policy_favorite(
        user_id=customer.id,
        policy_id="hz-cert",
        title="杭州检疫证明更新",
        district="西湖区",
    )

    assert favorite.id == again.id
    assert repo.list_policy_favorites(customer.id)[0].title == "杭州检疫证明更新"
    assert repo.delete_policy_favorite(customer.id, "hz-cert") is True
    assert repo.list_policy_favorites(customer.id) == []
