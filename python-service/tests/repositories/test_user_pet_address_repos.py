import pytest
from datetime import UTC, datetime, timedelta
from sqlalchemy.orm import Session

from app.repositories.address_repo import AddressRepository
from app.repositories.pet_repo import PetRepository
from app.repositories.provider_application_repo import ProviderApplicationRepository
from app.repositories.user_repo import UserRepository


@pytest.fixture
def demo_user(db: Session):
    return UserRepository(db).upsert_by_phone(
        phone="13800000001",
        nickname="演示主人",
        avatar="cat",
    )


def test_create_user_and_default_session(db: Session):
    user = UserRepository(db).upsert_by_phone(
        phone="13800000000",
        nickname="咪咪主人",
        avatar="cat",
    )
    assert user.phone == "13800000000"
    session = UserRepository(db).create_session(user.id)
    assert session.user_id == user.id
    assert session.revoked_at is None
    found_user = UserRepository(db).get_by_session_token(session.token_hash)
    assert found_user is not None
    assert found_user.id == user.id


def test_upsert_by_phone_updates_existing_user(db: Session):
    repo = UserRepository(db)
    created = repo.upsert_by_phone(
        phone="13800000002",
        nickname="旧昵称",
        avatar="old",
    )
    updated = repo.upsert_by_phone(
        phone="13800000002",
        nickname="新昵称",
        avatar="new",
    )

    assert updated.id == created.id
    assert updated.nickname == "新昵称"
    assert updated.avatar == "new"


def test_create_pet_and_address(db: Session, demo_user):
    pet = PetRepository(db).create(
        user_id=demo_user.id,
        name="急急",
        breed="三花",
        weight="3kg",
        vaccine="猫三联",
        certificate="检疫证明待办理",
        avatar="cat",
    )
    address = AddressRepository(db).create(
        user_id=demo_user.id,
        label="家",
        address="杭州市拱墅区祥符街道",
        district="拱墅区",
        lat=30.319,
        lng=120.139,
        is_default=True,
    )
    assert pet.name == "急急"
    assert address.is_default is True


def test_list_pets_by_user(db: Session, demo_user):
    repo = PetRepository(db)
    first = repo.create(user_id=demo_user.id, name="急急")
    second = repo.create(user_id=demo_user.id, name="慢慢")

    pets = repo.list_by_user(demo_user.id)

    assert [pet.id for pet in pets] == [first.id, second.id]


def test_update_pet_fields(db: Session, demo_user):
    repo = PetRepository(db)
    pet = repo.create(user_id=demo_user.id, name="急急", breed="三花")

    updated = repo.update(
        pet.id,
        name="团团",
        breed="英短",
        weight="4kg",
        vaccine="已打",
    )

    assert updated is not None
    assert updated.name == "团团"
    assert updated.breed == "英短"
    assert updated.weight == "4kg"
    assert updated.vaccine == "已打"


def test_update_pet_unknown_field_raises_value_error(db: Session, demo_user):
    repo = PetRepository(db)
    pet = repo.create(user_id=demo_user.id, name="急急")

    with pytest.raises(ValueError, match="color"):
        repo.update(pet.id, color="white")


def test_set_default_address(db: Session, demo_user):
    repo = AddressRepository(db)
    home = repo.create(
        user_id=demo_user.id,
        label="家",
        address="杭州市拱墅区祥符街道",
        is_default=True,
    )
    office = repo.create(
        user_id=demo_user.id,
        label="公司",
        address="杭州市西湖区文三路",
        is_default=True,
    )

    db.refresh(home)
    assert home.is_default is False
    assert office.is_default is True

    repo.set_default(home.id)
    db.refresh(office)
    assert home.is_default is True
    assert office.is_default is False
    assert [address.id for address in repo.list_by_user(demo_user.id)] == [home.id, office.id]


def test_expired_session_token_does_not_return_user(db: Session, demo_user):
    repo = UserRepository(db)
    session = repo.create_session(
        user_id=demo_user.id,
        token_hash="expired-token",
        expires_at=datetime.now(UTC) - timedelta(days=1),
    )

    assert repo.get_by_session_token(session.token_hash) is None


def test_revoked_session_token_does_not_return_user(db: Session, demo_user):
    repo = UserRepository(db)
    session = repo.create_session(user_id=demo_user.id, token_hash="revoked-token")
    session.revoked_at = datetime.now(UTC)
    db.flush()

    assert repo.get_by_session_token(session.token_hash) is None


def test_create_and_review_provider_application(db: Session, demo_user):
    repo = ProviderApplicationRepository(db)
    application = repo.create(
        user_id=demo_user.id,
        services=["cat_sitting"],
        base_district="拱墅区",
        intro="熟悉猫咪上门照护",
    )

    assert application.status == "pending"

    reviewed = repo.review(
        application_id=application.id,
        status="approved",
        review_note="资料完整",
        reviewed_by=demo_user.id,
    )
    assert reviewed is not None
    assert reviewed.status == "approved"
    assert reviewed.review_note == "资料完整"
    assert reviewed.reviewed_by == demo_user.id
    assert reviewed.reviewed_at is not None
