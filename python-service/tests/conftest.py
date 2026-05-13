import os
import re
import uuid
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

import app.models  # noqa: F401
from app.api.deps import get_db
from app.config.settings import settings
from app.main import app
from app.models.base import Base


TEST_DATABASE_URL = os.environ.get("MIMI_TEST_DATABASE_URL", settings.database_url)
TEST_SCHEMA_PATTERN = re.compile(r"^mimi_test_[A-Za-z0-9_]+$")


def _test_schema_name() -> str:
    schema_name = os.environ.get("MIMI_TEST_SCHEMA", f"mimi_test_{uuid.uuid4().hex}")
    if not TEST_SCHEMA_PATTERN.fullmatch(schema_name):
        raise ValueError(
            "MIMI_TEST_SCHEMA must start with mimi_test_ and contain only letters, "
            "numbers, or underscores"
        )
    return schema_name


def _quote_identifier(identifier: str) -> str:
    return f'"{identifier}"'


@pytest.fixture(scope="session")
def engine() -> Generator[Engine, None, None]:
    test_schema = _test_schema_name()
    test_engine = create_engine(TEST_DATABASE_URL, future=True, pool_pre_ping=True)

    @event.listens_for(test_engine, "connect")
    def set_search_path(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute(f"SET search_path TO {_quote_identifier(test_schema)}")
        finally:
            cursor.close()

    with test_engine.begin() as connection:
        connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {_quote_identifier(test_schema)}"))

    Base.metadata.create_all(bind=test_engine)
    try:
        yield test_engine
    finally:
        Base.metadata.drop_all(bind=test_engine)
        with test_engine.begin() as connection:
            connection.execute(
                text(f"DROP SCHEMA IF EXISTS {_quote_identifier(test_schema)} CASCADE")
            )
        test_engine.dispose()


@pytest.fixture
def db(engine) -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    testing_session_local = sessionmaker(
        bind=connection,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True,
    )
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db

    previous_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        if previous_override is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_override
