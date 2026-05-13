from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.config.settings import settings
from app.repositories.provider_application_repo import ProviderApplicationRepository
from app.repositories.user_repo import UserRepository


headers = {"X-Internal-Token": settings.internal_api_token}


def _session_factory(engine: Engine):
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True)


def _create_user(engine: Engine, phone: str, role: str = "customer"):
    with _session_factory(engine)() as session:
        user = UserRepository(session).upsert_by_phone(phone, phone, "cat")
        user.role = role
        session.commit()
        return user


def test_governance_api_dashboard_review_and_policy_favorites(client, engine: Engine):
    admin = _create_user(engine, "13970000001", role="admin")
    user = _create_user(engine, "13970000002")
    with _session_factory(engine)() as session:
        application = ProviderApplicationRepository(session).create(
            user_id=user.id,
            services=["buddy"],
            base_district="拱墅区",
            intro="可照护",
        )
        session.commit()
        application_id = str(application.id)

    reviewed = client.post(
        f"/internal/governance/provider-applications/{application_id}/review",
        headers=headers,
        json={
            "admin_user_id": str(admin.id),
            "status": "approved",
            "review_note": "通过",
        },
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["application"]["status"] == "approved"

    favorite = client.post(
        "/internal/governance/policy-favorites",
        headers=headers,
        json={
            "user_id": str(user.id),
            "policy_id": "policy-1",
            "title": "政策一",
            "district": "拱墅区",
        },
    )
    assert favorite.status_code == 200

    favorites = client.get(
        "/internal/governance/policy-favorites",
        headers=headers,
        params={"user_id": str(user.id)},
    )
    assert favorites.status_code == 200
    assert favorites.json()["items"][0]["policy_id"] == "policy-1"

    dashboard = client.get(
        "/internal/governance/admin/dashboard",
        headers=headers,
        params={"admin_user_id": str(admin.id)},
    )
    assert dashboard.status_code == 200
    assert dashboard.json()["provider_applications"][0]["id"] == application_id
    assert dashboard.json()["audit_logs"][0]["action"] == "review_provider_application"


def test_governance_api_complaint_and_dispute(client, engine: Engine):
    admin = _create_user(engine, "13970000003", role="admin")
    user = _create_user(engine, "13970000004")

    complaint = client.post(
        "/internal/governance/complaints",
        headers=headers,
        json={
            "complainant_user_id": str(user.id),
            "category": "service_quality",
            "content": "服务迟到",
        },
    )
    assert complaint.status_code == 200

    handled = client.post(
        f"/internal/governance/complaints/{complaint.json()['id']}/handle",
        headers=headers,
        json={
            "admin_user_id": str(admin.id),
            "status": "resolved",
            "resolution": "已处理",
        },
    )
    assert handled.status_code == 200
    assert handled.json()["status"] == "resolved"
