from uuid import UUID

from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.config.settings import settings
from app.db.seed import seed_sample_providers
from app.models.user import User
from app.repositories.user_repo import UserRepository


headers = {"X-Internal-Token": settings.internal_api_token}


def _session_factory(engine: Engine):
    return sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True,
    )


def test_seeded_provider_can_be_listed_and_used_for_offer(client, engine: Engine):
    with _session_factory(engine)() as session:
        seed_sample_providers(session)
        customer = UserRepository(session).upsert_by_phone(
            phone="13830001001",
            nickname="端到端用户",
            avatar="cat",
        )
        session.commit()
        customer_id = customer.id

    providers = client.get("/internal/profiles/providers", headers=headers)
    assert providers.status_code == 200
    provider_id = providers.json()["items"][0]["user_id"]

    with _session_factory(engine)() as session:
        assert session.get(User, UUID(provider_id)) is not None

    demand = client.post(
        "/internal/marketplace/demands",
        headers=headers,
        json={
            "user_id": str(customer_id),
            "service_type": "feeding",
            "title": "端到端喂猫",
            "district": "拱墅区",
        },
    )
    assert demand.status_code == 200

    offer = client.post(
        f"/internal/marketplace/demands/{demand.json()['id']}/offers",
        headers=headers,
        json={"provider_user_id": provider_id, "quote_amount_fen": 8800},
    )
    assert offer.status_code == 200

    accepted = client.post(
        f"/internal/marketplace/offers/{offer.json()['id']}/accept",
        headers=headers,
        json={"operator_user_id": str(customer_id)},
    )
    assert accepted.status_code == 200
    assert accepted.json()["order"]["seller_user_id"] == provider_id


def test_get_seeded_provider_bundle(client, engine: Engine):
    with _session_factory(engine)() as session:
        seed_sample_providers(session)
        session.commit()

    provider_id = "33333333-3333-4333-8333-333333333333"
    response = client.get(f"/internal/profiles/providers/{provider_id}", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["id"] == provider_id
    assert body["provider"]["user_id"] == provider_id
    assert body["vehicles"][0]["user_id"] == provider_id
