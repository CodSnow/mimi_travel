import pytest
from sqlalchemy.orm import Session

from app.repositories.address_repo import AddressRepository
from app.repositories.user_repo import UserRepository


headers = {"X-Internal-Token": "change-me"}


@pytest.fixture
def demo_user(db: Session):
    return UserRepository(db).upsert_by_phone(
        phone="13800000099",
        nickname="演示用户",
        avatar="cat",
    )


def test_login_returns_user_and_session_token(client):
    response = client.post(
        "/internal/identity/login",
        headers=headers,
        json={
            "phone": "13800000100",
            "nickname": "登录用户",
            "avatar": "cat",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["phone"] == "13800000100"
    assert body["user"]["nickname"] == "登录用户"
    assert body["user"]["avatar"] == "cat"
    assert body["user"]["role"] == "customer"
    assert body["user"]["verified"] is False
    assert body["session"]["token"]
    assert body["session"]["expires_at"]


def test_create_and_list_pets(client, demo_user):
    user = demo_user
    payload = {
        "user_id": str(user.id),
        "name": "急急",
        "breed": "三花",
        "weight": "3kg",
        "vaccine": "猫三联",
        "certificate": "检疫证明",
        "avatar": "cat",
    }

    created = client.post("/internal/profiles/pets", headers=headers, json=payload)
    assert created.status_code == 200
    created_body = created.json()
    assert created_body["user_id"] == str(user.id)
    assert created_body["name"] == "急急"
    assert created_body["breed"] == "三花"
    assert created_body["weight"] == "3kg"
    assert created_body["vaccine"] == "猫三联"
    assert created_body["certificate"] == "检疫证明"
    assert created_body["avatar"] == "cat"

    listed = client.get(
        "/internal/profiles/pets",
        headers=headers,
        params={"user_id": str(user.id)},
    )
    assert listed.status_code == 200
    assert listed.json() == [created_body]


def test_list_addresses(client, db: Session, demo_user):
    user = demo_user
    address = AddressRepository(db).create(
        user_id=user.id,
        label="家",
        address="杭州市拱墅区祥符街道",
        district="拱墅区",
        contact_name="咪咪主人",
        contact_phone="13800000111",
        is_default=True,
    )

    response = client.get(
        "/internal/profiles/addresses",
        headers=headers,
        params={"user_id": str(user.id)},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == str(address.id)
    assert body[0]["user_id"] == str(user.id)
    assert body[0]["label"] == "家"
    assert body[0]["is_default"] is True


def test_create_provider_application(client, demo_user):
    user = demo_user
    payload = {
        "user_id": str(user.id),
        "services": ["cat_sitting", "feeding"],
        "base_district": "拱墅区",
        "intro": "熟悉上门照护",
        "experience": "3年宠物照护",
        "credential_urls": ["https://example.com/cert-1"],
    }

    response = client.post(
        "/internal/profiles/provider-applications",
        headers=headers,
        json=payload,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == str(user.id)
    assert body["services"] == ["cat_sitting", "feeding"]
    assert body["base_district"] == "拱墅区"
    assert body["intro"] == "熟悉上门照护"
    assert body["experience"] == "3年宠物照护"
    assert body["credential_urls"] == ["https://example.com/cert-1"]
    assert body["status"] == "pending"
