import pytest
from sqlalchemy.orm import Session

from app.repositories.location_repo import LocationRepository
from app.repositories.marketplace_repo import MarketplaceRepository
from app.repositories.message_repo import MessageRepository
from app.repositories.user_repo import UserRepository
from app.services.locations.location_service import LocationService
from app.services.marketplace.marketplace_service import MarketplaceService
from app.services.messages.message_service import MessageService, MessageServiceError
from app.services.orders.order_state_service import OrderStateService


@pytest.fixture
def customer(db: Session):
    return UserRepository(db).upsert_by_phone("13940000001", "消息用户", "cat")


@pytest.fixture
def provider(db: Session):
    return UserRepository(db).upsert_by_phone("13940000002", "消息服务者", "provider")


@pytest.fixture
def outsider(db: Session):
    return UserRepository(db).upsert_by_phone("13940000003", "旁观用户", "other")


@pytest.fixture
def order(db: Session, customer, provider):
    marketplace = MarketplaceService(MarketplaceRepository(db), OrderStateService())
    demand = marketplace.create_demand(customer.id, "ride", "带猫去医院")
    offer = marketplace.create_offer(demand.id, provider.id, 6600)
    return marketplace.accept_offer(offer.id, customer.id).order


def test_order_conversation_send_message_and_read(db: Session, customer, provider, order):
    service = MessageService(MessageRepository(db))

    conversation = service.ensure_order_conversation(order.id)
    message = service.send_message(
        conversation.id,
        sender_user_id=customer.id,
        content="我在小区南门等",
        message_type="text",
        client_msg_id="client-1",
    )
    read = service.mark_read(conversation.id, provider.id, last_read_message_id=message.id)
    detail = service.get_conversation(conversation.id, provider.id)

    assert conversation.participant_user_ids == [str(customer.id), str(provider.id)]
    assert message.related_order_id == order.id
    assert read.last_read_message_id == message.id
    assert detail.messages[-1].content == "我在小区南门等"
    assert detail.read.id == read.id


def test_conversation_denies_non_participant(db: Session, outsider, order):
    service = MessageService(MessageRepository(db))
    conversation = service.ensure_order_conversation(order.id)

    with pytest.raises(MessageServiceError, match="access denied"):
        service.get_conversation(conversation.id, outsider.id)


def test_location_report_creates_snapshot_and_location_message(db: Session, provider, order):
    message_repo = MessageRepository(db)
    service = LocationService(LocationRepository(db), message_repo)

    result = service.report_location(
        order_id=order.id,
        user_id=provider.id,
        lat=30.2741,
        lng=120.1551,
        address="武林广场",
    )
    conversation = message_repo.find_order_conversation(order.id)
    messages = message_repo.list_messages(conversation.id)

    assert result.snapshot.order_id == order.id
    assert result.snapshot.coord_system == "gcj02"
    assert result.message_id == messages[-1].id
    assert messages[-1].type == "location"
    assert messages[-1].payload["address"] == "武林广场"
    assert service.list_order_locations(order.id, provider.id)[0].id == result.snapshot.id
