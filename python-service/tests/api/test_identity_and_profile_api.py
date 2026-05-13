from uuid import UUID, uuid4

from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.config.settings import settings
from app.models.pet import Pet
from app.models.provider_application import ProviderApplication
from app.models.user import User
from app.repositories.address_repo import AddressRepository
from app.repositories.user_repo import UserRepository
from app.services.identity.session_service import SessionService


headers = {"X-Internal-Token": settings.internal_api_token}


def _session_factory(engine: Engine):
    return sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True,
    )


def _create_user(engine: Engine, phone: str = "13800000099") -> User:
    with _session_factory(engine)() as session:
        user = UserRepository(session).upsert_by_phone(
            phone=phone,
            nickname="演示用户",
            avatar="cat",
        )
        session.commit()
        return user


def test_login_returns_user_and_session_token(client, engine: Engine):
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

    with _session_factory(engine)() as session:
        saved_user = session.get(User, UUID(body["user"]["id"]))
        assert saved_user is not None
        assert saved_user.phone == "13800000100"

        token_hash = SessionService(UserRepository(session)).hash_token(body["session"]["token"])
        authenticated_user = UserRepository(session).get_by_session_token(token_hash)
        assert authenticated_user is not None
        assert authenticated_user.id == saved_user.id


def test_create_and_list_pets(client, engine: Engine):
    user = _create_user(engine)
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

    with _session_factory(engine)() as session:
        saved_pet = session.get(Pet, UUID(created_body["id"]))
        assert saved_pet is not None
        assert saved_pet.user_id == user.id
        assert saved_pet.name == "急急"

    listed = client.get(
        "/internal/profiles/pets",
        headers=headers,
        params={"user_id": str(user.id)},
    )
    assert listed.status_code == 200
    assert listed.json() == [created_body]


def test_create_pet_requires_existing_user(client):
    response = client.post(
        "/internal/profiles/pets",
        headers=headers,
        json={
            "user_id": str(uuid4()),
            "name": "急急",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "user not found"


def test_list_addresses(client, engine: Engine):
    with _session_factory(engine)() as session:
        user = UserRepository(session).upsert_by_phone(
            phone="13800000101",
            nickname="地址用户",
            avatar="cat",
        )
        address = AddressRepository(session).create(
            user_id=user.id,
            label="家",
            address="杭州市拱墅区祥符街道",
            district="拱墅区",
            contact_name="咪咪主人",
            contact_phone="13800000111",
            is_default=True,
        )
        session.commit()
        user_id = user.id
        address_id = address.id

    response = client.get(
        "/internal/profiles/addresses",
        headers=headers,
        params={"user_id": str(user_id)},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == str(address_id)
    assert body[0]["user_id"] == str(user_id)
    assert body[0]["label"] == "家"
    assert body[0]["is_default"] is True


def test_create_provider_application(client, engine: Engine):
    user = _create_user(engine)
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

    with _session_factory(engine)() as session:
        saved_application = session.get(ProviderApplication, UUID(body["id"]))
        assert saved_application is not None
        assert saved_application.user_id == user.id
        assert saved_application.status == "pending"


def test_create_provider_application_requires_existing_user(client):
    response = client.post(
        "/internal/profiles/provider-applications",
        headers=headers,
        json={
            "user_id": str(uuid4()),
            "services": ["cat_sitting"],
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "user not found"
