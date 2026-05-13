# Python Domain Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 Python/PostgreSQL 主事实源基础，为完整 H5 闭环提供可测试的领域模型、迁移、仓储、服务和统一错误结构。

**Architecture:** 本阶段只处理 Python 领域服务基础，不改 H5 页面主流程。FastAPI 提供内部接口，SQLAlchemy 模型和 Alembic 迁移表达主数据结构，服务层封装状态机和业务规则。TS BFF 在后续 Phase 切换到这些内部接口。

**Tech Stack:** FastAPI、SQLAlchemy 2、Alembic、PostgreSQL、Pydantic、pytest、httpx、Docker Compose。

---

## File Structure

Create:

- `python-service/tests/conftest.py`：测试数据库、FastAPI client、基础 fixture。
- `python-service/tests/services/test_order_state_service.py`：订单状态机测试。
- `python-service/tests/services/test_payment_provider.py`：本地支付 provider 行为测试。
- `python-service/tests/repositories/test_user_pet_address_repos.py`：用户、宠物、地址仓储测试。
- `python-service/tests/api/test_identity_and_profile_api.py`：身份、宠物、地址、服务者申请内部 API 测试。
- `python-service/app/repositories/user_repo.py`：用户和 session 仓储。
- `python-service/app/repositories/pet_repo.py`：宠物档案仓储。
- `python-service/app/repositories/address_repo.py`：常用地址仓储。
- `python-service/app/repositories/provider_application_repo.py`：服务者入驻申请仓储。
- `python-service/app/services/identity/session_service.py`：本地 session/token 服务。
- `python-service/app/services/orders/order_state_service.py`：订单状态机。
- `python-service/app/services/payments/local_provider.py`：本地支付 provider。
- `python-service/app/api/internal/identity.py`：身份内部接口。
- `python-service/app/api/internal/profiles.py`：宠物、地址、服务者申请内部接口。
- `python-service/app/schemas/identity.py`：身份 DTO。
- `python-service/app/schemas/profile.py`：宠物、地址、服务者申请 DTO。
- `python-service/migrations/versions/0004_foundation_profiles.py`：新增基础表和字段。

Modify:

- `python-service/requirements.txt`：增加测试依赖。
- `python-service/pyproject.toml`：增加测试依赖和 pytest 配置。
- `python-service/app/api/router.py`：挂载 identity/profile 内部路由。
- `python-service/app/models/__init__.py`：导出新增模型。
- `python-service/app/models/user.py`：确认用户字段与 session 关联可用。
- `python-service/app/models/demand.py`：增加宠物快照相关字段。
- `python-service/app/models/order.py`：增加支付/退款摘要和宠物快照。
- `python-service/app/models/provider_profile.py`：增加服务开关、审核摘要。

Do not modify in this Phase:

- `client/src/**`
- `server/src/services/domain-store.ts`
- `mp/src/**`

## Verification Commands

Python 执行环境未确认前，不直接运行本机 Python。执行时优先使用 Docker Compose：

```bash
docker compose run --rm python-service python -m pytest tests -q
```

如果用户确认了本机 Python 环境，再使用该环境运行等价命令。

Build checks:

```bash
pnpm --filter ./server run build
pnpm --filter ./client run build
```

## Task 1: Add Python Test Harness

**Files:**

- Modify: `python-service/requirements.txt`
- Modify: `python-service/pyproject.toml`
- Create: `python-service/tests/conftest.py`

- [ ] **Step 1: Add test dependencies**

Modify `python-service/requirements.txt` to:

```text
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
sqlalchemy>=2.0.36
psycopg[binary]>=3.2.0
alembic>=1.13.0
pydantic-settings>=2.6.0
pytest>=8.3.0
httpx>=0.27.0
```

Modify `python-service/pyproject.toml` dependencies to include:

```toml
"pytest>=8.3.0",
"httpx>=0.27.0",
```

Add pytest config:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
```

- [ ] **Step 2: Create shared test fixtures**

Create `python-service/tests/conftest.py`:

```python
import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.api.deps import get_db
from app.config.settings import settings
from app.main import app
from app.models.base import Base


TEST_DATABASE_URL = os.environ.get("MIMI_TEST_DATABASE_URL", settings.database_url)


@pytest.fixture(scope="session")
def engine():
    engine = create_engine(TEST_DATABASE_URL, future=True, pool_pre_ping=True)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def db(engine) -> Generator[Session, None, None]:
    TestingSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True,
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture()
def client(db: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
```

- [ ] **Step 3: Run dependency-aware test command**

Run only after user approval for Docker or confirmed Python environment:

```bash
docker compose run --rm python-service python -m pytest tests -q
```

Expected initial result: pytest starts and reports no tests collected or fails only because test dependencies are not installed in the current image. If dependency installation is needed, request approval before building or installing.

## Task 2: Add Foundation Migration and Models

**Files:**

- Create: `python-service/migrations/versions/0004_foundation_profiles.py`
- Create: `python-service/app/models/session.py`
- Create: `python-service/app/models/address.py`
- Create: `python-service/app/models/provider_application.py`
- Create: `python-service/app/models/policy_favorite.py`
- Modify: `python-service/app/models/demand.py`
- Modify: `python-service/app/models/order.py`
- Modify: `python-service/app/models/provider_profile.py`
- Modify: `python-service/app/models/__init__.py`

- [ ] **Step 1: Create migration**

Create `python-service/migrations/versions/0004_foundation_profiles.py` with tables:

```python
"""foundation profiles

Revision ID: 0004_foundation_profiles
Revises: 0003_add_vehicle_intel
Create Date: 2026-05-13
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0004_foundation_profiles"
down_revision: str | None = "0003_add_vehicle_intel"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("token_hash", name="uq_sessions_token_hash"),
    )
    op.create_index("idx_sessions_user_id", "sessions", ["user_id"])

    op.create_table(
        "addresses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("label", sa.String(length=64), nullable=False),
        sa.Column("contact_name", sa.String(length=64), nullable=True),
        sa.Column("contact_phone", sa.String(length=32), nullable=True),
        sa.Column("district", sa.String(length=64), nullable=True),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("lng", sa.Numeric(10, 7), nullable=True),
        sa.Column("coord_system", sa.String(length=16), nullable=False, server_default="gcj02"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_addresses_user_id", "addresses", ["user_id"])

    op.create_table(
        "provider_applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("services", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("base_district", sa.String(length=64), nullable=True),
        sa.Column("intro", sa.Text(), nullable=True),
        sa.Column("experience", sa.Text(), nullable=True),
        sa.Column("credential_urls", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_provider_applications_user_id", "provider_applications", ["user_id"])
    op.create_index("idx_provider_applications_status", "provider_applications", ["status"])

    op.create_table(
        "policy_favorites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("policy_id", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("district", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "policy_id", name="uq_policy_favorites_user_policy"),
    )
    op.create_index("idx_policy_favorites_user_id", "policy_favorites", ["user_id"])

    op.add_column("demands", sa.Column("pet_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")))
    op.add_column("demands", sa.Column("pet_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("orders", sa.Column("pet_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("orders", sa.Column("payment_status", sa.String(length=32), nullable=False, server_default="unpaid"))
    op.add_column("orders", sa.Column("refund_status", sa.String(length=32), nullable=False, server_default="none"))
    op.add_column("orders", sa.Column("feedback_summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("provider_profiles", sa.Column("accepting_orders", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("provider_profiles", sa.Column("service_time_slots", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")))


def downgrade() -> None:
    op.drop_column("provider_profiles", "service_time_slots")
    op.drop_column("provider_profiles", "accepting_orders")
    op.drop_column("orders", "feedback_summary")
    op.drop_column("orders", "refund_status")
    op.drop_column("orders", "payment_status")
    op.drop_column("orders", "pet_snapshot")
    op.drop_column("demands", "pet_snapshot")
    op.drop_column("demands", "pet_ids")
    op.drop_index("idx_policy_favorites_user_id", table_name="policy_favorites")
    op.drop_table("policy_favorites")
    op.drop_index("idx_provider_applications_status", table_name="provider_applications")
    op.drop_index("idx_provider_applications_user_id", table_name="provider_applications")
    op.drop_table("provider_applications")
    op.drop_index("idx_addresses_user_id", table_name="addresses")
    op.drop_table("addresses")
    op.drop_index("idx_sessions_user_id", table_name="sessions")
    op.drop_table("sessions")
```

- [ ] **Step 2: Add model classes**

Create the matching SQLAlchemy models for `SessionRecord`, `Address`, `ProviderApplication`, and `PolicyFavorite`. Use existing `Base`, `UUIDPrimaryKeyMixin`, and `TimestampMixin` patterns from `python-service/app/models/base.py`.

- [ ] **Step 3: Export new models**

Modify `python-service/app/models/__init__.py` to import and export the new models:

```python
from app.models.address import Address
from app.models.policy_favorite import PolicyFavorite
from app.models.provider_application import ProviderApplication
from app.models.session import SessionRecord
```

Add these names to `__all__`.

- [ ] **Step 4: Run migration syntax check**

Run after Python environment approval:

```bash
docker compose run --rm python-service python -m compileall app migrations
```

Expected: compileall completes without syntax errors.

## Task 3: Implement Repositories

**Files:**

- Create: `python-service/app/repositories/user_repo.py`
- Create: `python-service/app/repositories/pet_repo.py`
- Create: `python-service/app/repositories/address_repo.py`
- Create: `python-service/app/repositories/provider_application_repo.py`
- Create: `python-service/tests/repositories/test_user_pet_address_repos.py`

- [ ] **Step 1: Write repository tests**

Create tests that assert:

```python
def test_create_user_and_default_session(db):
    user = UserRepository(db).upsert_by_phone(
        phone="13800000000",
        nickname="咪咪主人",
        avatar="cat",
    )
    assert user.phone == "13800000000"
    session = UserRepository(db).create_session(user.id)
    assert session.user_id == user.id
    assert session.revoked_at is None


def test_create_pet_and_address(db, demo_user):
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
```

- [ ] **Step 2: Implement repository methods**

Implement methods:

- `UserRepository.upsert_by_phone`
- `UserRepository.create_session`
- `UserRepository.get_by_session_token`
- `PetRepository.create`
- `PetRepository.list_by_user`
- `PetRepository.update`
- `AddressRepository.create`
- `AddressRepository.list_by_user`
- `AddressRepository.set_default`
- `ProviderApplicationRepository.create`
- `ProviderApplicationRepository.review`

- [ ] **Step 3: Run repository tests**

Run after environment approval:

```bash
docker compose run --rm python-service python -m pytest tests/repositories/test_user_pet_address_repos.py -q
```

Expected: all repository tests pass.

## Task 4: Implement Session and Order State Services

**Files:**

- Create: `python-service/app/services/identity/session_service.py`
- Create: `python-service/app/services/orders/order_state_service.py`
- Create: `python-service/tests/services/test_order_state_service.py`

- [ ] **Step 1: Write order state tests**

Create `python-service/tests/services/test_order_state_service.py`:

```python
import pytest

from app.services.orders.order_state_service import OrderStateError, OrderStateService


def test_paid_order_can_start_and_complete():
    service = OrderStateService()
    assert service.next_status("paid", "confirm_arrival") == "arriving"
    assert service.next_status("arriving", "start_service") == "serving"
    assert service.next_status("serving", "complete") == "completed"


def test_pending_payment_cannot_start_service():
    service = OrderStateService()
    with pytest.raises(OrderStateError):
        service.next_status("pending_payment", "start_service")


def test_completed_order_cannot_cancel():
    service = OrderStateService()
    with pytest.raises(OrderStateError):
        service.next_status("completed", "cancel")
```

- [ ] **Step 2: Implement order state service**

Create `python-service/app/services/orders/order_state_service.py`:

```python
class OrderStateError(ValueError):
    pass


class OrderStateService:
    transitions = {
        "confirm_arrival": {"paid": "arriving", "confirmed": "arriving"},
        "start_service": {"paid": "serving", "confirmed": "serving", "arriving": "serving"},
        "complete": {"paid": "completed", "confirmed": "completed", "arriving": "completed", "serving": "completed"},
        "cancel": {
            "pending_payment": "cancelled",
            "paid": "cancelled",
            "confirmed": "cancelled",
            "arriving": "cancelled",
            "serving": "cancelled",
        },
        "request_refund": {"paid": "refund_pending", "confirmed": "refund_pending", "cancelled": "refund_pending"},
        "mark_refunded": {"refund_pending": "refunded"},
    }

    def next_status(self, current_status: str, action: str) -> str:
        action_transitions = self.transitions.get(action)
        if action_transitions is None or current_status not in action_transitions:
            raise OrderStateError(f"order status {current_status} can not perform {action}")
        return action_transitions[current_status]
```

- [ ] **Step 3: Implement session service**

Create `python-service/app/services/identity/session_service.py` with token creation and hashing:

```python
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.repositories.user_repo import UserRepository


class SessionService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    def create_login_session(self, user_id: UUID) -> tuple[str, object]:
        token = secrets.token_urlsafe(32)
        token_hash = self.hash_token(token)
        session = self.user_repo.create_session(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=14),
        )
        return token, session

    def hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()
```

- [ ] **Step 4: Run service tests**

Run:

```bash
docker compose run --rm python-service python -m pytest tests/services/test_order_state_service.py -q
```

Expected: all service tests pass.

## Task 5: Implement Local Payment Provider

**Files:**

- Create: `python-service/app/services/payments/local_provider.py`
- Create: `python-service/tests/services/test_payment_provider.py`

- [ ] **Step 1: Write provider tests**

Create `python-service/tests/services/test_payment_provider.py`:

```python
from app.services.payments.local_provider import LocalPaymentProvider


def test_create_local_payment_payload():
    provider = LocalPaymentProvider(channel="alipay")
    result = provider.create_payment(
        out_trade_no="MIMI202605130001",
        amount_fen=9900,
        subject="咪咪出行订单",
    )
    assert result["status"] == "pending"
    assert result["channel"] == "alipay"
    assert result["pay_url"].endswith("/MIMI202605130001")


def test_refund_local_payment_payload():
    provider = LocalPaymentProvider(channel="wechat_pay")
    result = provider.refund(
        out_trade_no="MIMI202605130002",
        refund_amount_fen=3000,
        reason="用户取消",
    )
    assert result["status"] == "success"
    assert result["refund_amount_fen"] == 3000
```

- [ ] **Step 2: Implement local provider**

Create `python-service/app/services/payments/local_provider.py`:

```python
class LocalPaymentProvider:
    def __init__(self, channel: str) -> None:
        if channel not in {"alipay", "wechat_pay"}:
            raise ValueError("unsupported local payment channel")
        self.channel = channel

    def create_payment(self, out_trade_no: str, amount_fen: int, subject: str) -> dict:
        return {
            "channel": self.channel,
            "status": "pending",
            "out_trade_no": out_trade_no,
            "amount_fen": amount_fen,
            "subject": subject,
            "pay_url": f"mimi-travel://local-pay/{self.channel}/{out_trade_no}",
            "app_params": {
                "channel": self.channel,
                "outTradeNo": out_trade_no,
                "amountFen": str(amount_fen),
            },
        }

    def query(self, out_trade_no: str, mark_paid: bool = False) -> dict:
        return {
            "channel": self.channel,
            "out_trade_no": out_trade_no,
            "status": "paid" if mark_paid else "pending",
        }

    def close(self, out_trade_no: str) -> dict:
        return {
            "channel": self.channel,
            "out_trade_no": out_trade_no,
            "status": "closed",
        }

    def refund(self, out_trade_no: str, refund_amount_fen: int, reason: str) -> dict:
        return {
            "channel": self.channel,
            "out_trade_no": out_trade_no,
            "refund_amount_fen": refund_amount_fen,
            "reason": reason,
            "status": "success",
        }
```

- [ ] **Step 3: Run provider tests**

Run:

```bash
docker compose run --rm python-service python -m pytest tests/services/test_payment_provider.py -q
```

Expected: all payment provider tests pass.

## Task 6: Add Identity/Profile Internal APIs

**Files:**

- Create: `python-service/app/schemas/identity.py`
- Create: `python-service/app/schemas/profile.py`
- Create: `python-service/app/api/internal/identity.py`
- Create: `python-service/app/api/internal/profiles.py`
- Modify: `python-service/app/api/router.py`
- Create: `python-service/tests/api/test_identity_and_profile_api.py`

- [ ] **Step 1: Write API tests**

Create API tests for:

- `POST /internal/identity/login`
- `GET /internal/profiles/pets`
- `POST /internal/profiles/pets`
- `GET /internal/profiles/addresses`
- `POST /internal/profiles/provider-applications`

Use header:

```python
headers = {"X-Internal-Token": "change-me"}
```

Assert login returns `user` and `session.token`; pet creation returns the created pet; provider application returns status `pending`.

- [ ] **Step 2: Implement schemas**

Define Pydantic DTOs with explicit fields:

- `LoginRequest`
- `LoginResponse`
- `PetCreateRequest`
- `PetResponse`
- `AddressCreateRequest`
- `AddressResponse`
- `ProviderApplicationCreateRequest`
- `ProviderApplicationResponse`

- [ ] **Step 3: Implement routers**

Use `Depends(verify_internal_token)` and `Depends(get_db)` in both routers. Do not expose these endpoints directly to the frontend.

- [ ] **Step 4: Mount routers**

Modify `python-service/app/api/router.py` to include:

```python
from app.api.internal import identity, profiles

api_router.include_router(identity.router, prefix="/internal/identity", tags=["internal-identity"])
api_router.include_router(profiles.router, prefix="/internal/profiles", tags=["internal-profiles"])
```

- [ ] **Step 5: Run API tests**

Run:

```bash
docker compose run --rm python-service python -m pytest tests/api/test_identity_and_profile_api.py -q
```

Expected: all identity/profile API tests pass.

## Task 7: Phase Verification

**Files:**

- Modify only if failures reveal Phase 1 issues.

- [ ] **Step 1: Python compile verification**

Run after environment approval:

```bash
docker compose run --rm python-service python -m compileall app migrations
```

Expected: no syntax errors.

- [ ] **Step 2: Python tests**

Run:

```bash
docker compose run --rm python-service python -m pytest tests -q
```

Expected: all Phase 1 tests pass.

- [ ] **Step 3: TypeScript builds**

Run:

```bash
pnpm --filter ./server run build
pnpm --filter ./client run build
```

Expected: both builds pass. This Phase should not change H5 or TS behavior, so any failure is a regression.

- [ ] **Step 4: Record results**

Append verification results to `当前实施计划.md` under a new section:

```markdown
## 2026-05-13 Phase 1 验证结果

- Python compile：通过
- Python tests：通过
- Server build：通过
- Client build：通过
- 备注：当前目录不是 Git 仓库，无法提交 commit。
```

If any command cannot run because Docker, dependencies, or Python environment is unavailable, record the exact blocker instead of marking it passed.

## Self-Review Checklist

- Spec coverage: This Phase covers the Python/PostgreSQL foundation, not the complete product. Remaining phases are listed in the roadmap.
- Placeholder scan: No step depends on an unnamed file or undefined command; Python execution uses Docker Compose unless the user confirms a local environment.
- Type consistency: Status names match existing shared order status vocabulary where this Phase touches order state.
