# Marketplace Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the demand, offer, accept-offer, order creation, and order transition write path in Python/PostgreSQL, while keeping the existing H5-facing TypeScript BFF API stable.

**Architecture:** Python FastAPI becomes the source of truth for marketplace data. TypeScript BFF keeps the public `/api/demands`, `/api/offers`, and `/api/orders` contracts, but delegates core reads and writes to Python through `PythonClient`. `DomainStore` remains available for non-marketplace compatibility and later phases, but is no longer used for the Phase 2 marketplace write path.

**Tech Stack:** FastAPI, SQLAlchemy 2, PostgreSQL, Pydantic, pytest, Express 5, TypeScript, pnpm, Docker Compose.

---

## File Structure

Create:

- `python-service/app/repositories/marketplace_repo.py`: demand, offer, order, and order event persistence methods.
- `python-service/app/services/marketplace/marketplace_service.py`: business workflow for creating demands, creating offers, accepting offers, cancelling demands, and transitioning orders.
- `python-service/app/services/marketplace/__init__.py`: service package marker.
- `python-service/app/schemas/marketplace.py`: internal DTOs matching the H5-facing BFF contract.
- `python-service/app/api/internal/marketplace.py`: internal FastAPI routes for the marketplace workflow.
- `python-service/tests/repositories/test_marketplace_repo.py`: repository behavior tests.
- `python-service/tests/services/test_marketplace_service.py`: workflow and state machine tests.
- `python-service/tests/api/test_marketplace_api.py`: internal API persistence and error tests.
- `server/src/internal-dto/marketplace.ts`: TypeScript DTOs for Python marketplace endpoints.

Modify:

- `python-service/app/api/router.py`: mount `/internal/marketplace`.
- `server/src/services/python-client.ts`: add marketplace methods and support GET requests with query params.
- `server/src/modules/demands/routes.ts`: call Python for create/list/get/cancel demand.
- `server/src/modules/offers/routes.ts`: call Python for create/list/accept/reject/withdraw offer.
- `server/src/modules/orders/routes.ts`: call Python for list/get/transition order and order events.
- `server/src/app.ts`: pass `PythonClient` into demand/offer routers.
- `当前实施计划.md`: append Phase 2 verification results.

Do not modify in this Phase:

- `client/src/**`
- `mp/src/**`
- Payment, refunds, messages, navigation, reviews, policy AI, and governance flows beyond marketplace order events.

## Public Contract

The TypeScript BFF must keep these existing H5-facing routes:

- `POST /api/demands`
- `GET /api/demands`
- `GET /api/demands/:id`
- `POST /api/demands/:id/cancel`
- `POST /api/demands/:id/offers`
- `GET /api/demands/:id/offers`
- `POST /api/offers/:id/accept`
- `POST /api/offers/:id/reject`
- `POST /api/offers/:id/withdraw`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders/:id/confirm-arrival`
- `POST /api/orders/:id/start-service`
- `POST /api/orders/:id/complete`
- `POST /api/orders/:id/cancel`

DTO field names at the BFF boundary remain camelCase. Python internal DTOs use snake_case; `PythonClient` already converts keys both ways.

## Verification Commands

Python commands must run through Docker Compose unless the user confirms a local Python environment:

```bash
docker compose build python-service
docker compose run --rm python-service python -m pytest tests/repositories/test_marketplace_repo.py -q
docker compose run --rm python-service python -m pytest tests/services/test_marketplace_service.py -q
docker compose run --rm python-service python -m pytest tests/api/test_marketplace_api.py -q
docker compose run --rm python-service python -m pytest tests -q
docker compose run --rm python-service python -m compileall app migrations
```

TypeScript verification:

```bash
pnpm --filter ./server run build
pnpm --filter ./client run build
```

---

## Task 1: Marketplace Repository

**Files:**

- Create: `python-service/app/repositories/marketplace_repo.py`
- Create: `python-service/tests/repositories/test_marketplace_repo.py`

- [ ] **Step 1: Write repository tests**

Create tests for:

```python
def test_create_and_list_demand(db, demo_customer):
    repo = MarketplaceRepository(db)
    demand = repo.create_demand(
        user_id=demo_customer.id,
        service_type="feeding",
        title="上门喂猫",
        description="每天晚上喂一次",
        pet_summary="一只三花",
        budget_min_fen=5000,
        budget_max_fen=8000,
        expected_price_fen=7000,
        contact_name="咪咪主人",
        contact_phone="13800000001",
        allow_bargain=True,
        visibility_radius_km=5,
        district="拱墅区",
        pickup={"district": "拱墅区", "address": "祥符街道"},
        destination=None,
        care_requirements={"needHomeVisit": True},
        ride_requirements=None,
    )
    assert demand.status == "open"
    assert repo.get_demand(demand.id).id == demand.id
    assert [item.id for item in repo.list_demands(status="open")] == [demand.id]
```

```python
def test_create_offer_rejects_duplicate_active_offer(db, demo_customer, demo_provider):
    repo = MarketplaceRepository(db)
    demand = repo.create_demand(user_id=demo_customer.id, service_type="feeding", title="上门喂猫")
    offer = repo.create_offer(
        demand_id=demand.id,
        provider_user_id=demo_provider.id,
        quote_amount_fen=8800,
        message="可以上门",
    )
    assert offer.status == "submitted"

    with pytest.raises(MarketplaceRepositoryError, match="active offer"):
        repo.create_offer(
            demand_id=demand.id,
            provider_user_id=demo_provider.id,
            quote_amount_fen=8900,
        )
```

```python
def test_create_order_and_order_event(db, demo_customer, demo_provider):
    repo = MarketplaceRepository(db)
    demand = repo.create_demand(user_id=demo_customer.id, service_type="feeding", title="上门喂猫")
    offer = repo.create_offer(demand.id, demo_provider.id, 8800)
    order = repo.create_order_from_offer(demand, offer)
    event = repo.create_order_event(order.id, "offer_accepted", demo_customer.id, {"offerId": str(offer.id)})

    assert order.status == "pending_payment"
    assert order.deposit_fen == 2640
    assert event.event_type == "offer_accepted"
    assert repo.list_order_events(order.id)[0].id == event.id
```

- [ ] **Step 2: Implement repository**

Implement:

- `MarketplaceRepository.create_demand`
- `MarketplaceRepository.list_demands`
- `MarketplaceRepository.get_demand`
- `MarketplaceRepository.create_offer`
- `MarketplaceRepository.list_offers`
- `MarketplaceRepository.get_offer`
- `MarketplaceRepository.update_offer_status`
- `MarketplaceRepository.create_order_from_offer`
- `MarketplaceRepository.list_orders_for_user`
- `MarketplaceRepository.get_order`
- `MarketplaceRepository.create_order_event`
- `MarketplaceRepository.list_order_events`

Raise `MarketplaceRepositoryError` for duplicate active offer.

- [ ] **Step 3: Verify repository tests**

Run:

```bash
docker compose build python-service
docker compose run --rm python-service python -m pytest tests/repositories/test_marketplace_repo.py -q
```

Expected: all repository tests pass.

- [ ] **Step 4: Commit**

```bash
git add python-service/app/repositories/marketplace_repo.py python-service/tests/repositories/test_marketplace_repo.py
git commit -m "feat(python): add marketplace repository"
```

## Task 2: Marketplace Service

**Files:**

- Create: `python-service/app/services/marketplace/__init__.py`
- Create: `python-service/app/services/marketplace/marketplace_service.py`
- Create: `python-service/tests/services/test_marketplace_service.py`

- [ ] **Step 1: Write service tests**

Create tests for:

```python
def test_accept_offer_rejects_other_submitted_offers_and_creates_order(db, demo_customer, demo_provider, another_provider):
    repo = MarketplaceRepository(db)
    service = MarketplaceService(repo, OrderStateService())
    demand = service.create_demand(user_id=demo_customer.id, service_type="feeding", title="上门喂猫")
    accepted = service.create_offer(demand.id, demo_provider.id, quote_amount_fen=9000)
    other = service.create_offer(demand.id, another_provider.id, quote_amount_fen=8500)

    result = service.accept_offer(accepted.id, operator_user_id=demo_customer.id)

    assert result.offer.status == "accepted"
    assert result.order.status == "pending_payment"
    assert repo.get_offer(other.id).status == "rejected"
    assert repo.get_demand(demand.id).status == "matched"
    assert repo.get_demand(demand.id).selected_offer_id == accepted.id
    assert repo.list_order_events(result.order.id)[0].event_type == "offer_accepted"
```

```python
def test_accept_offer_requires_demand_owner(db, demo_customer, demo_provider, another_provider):
    repo = MarketplaceRepository(db)
    service = MarketplaceService(repo, OrderStateService())
    demand = service.create_demand(user_id=demo_customer.id, service_type="feeding", title="上门喂猫")
    offer = service.create_offer(demand.id, demo_provider.id, quote_amount_fen=9000)

    with pytest.raises(MarketplaceServiceError, match="only demand owner"):
        service.accept_offer(offer.id, operator_user_id=another_provider.id)
```

```python
def test_order_transition_updates_order_demand_and_event(db, demo_customer, demo_provider):
    repo = MarketplaceRepository(db)
    service = MarketplaceService(repo, OrderStateService())
    demand = service.create_demand(user_id=demo_customer.id, service_type="feeding", title="上门喂猫")
    offer = service.create_offer(demand.id, demo_provider.id, quote_amount_fen=9000)
    result = service.accept_offer(offer.id, operator_user_id=demo_customer.id)
    result.order.status = "paid"
    db.flush()

    transitioned = service.transition_order(result.order.id, "start_service", operator_user_id=demo_provider.id)

    assert transitioned.status == "serving"
    assert repo.get_demand(demand.id).status == "in_service"
    assert repo.list_order_events(result.order.id)[-1].event_type == "order_start_service"
```

- [ ] **Step 2: Implement service**

Implement `MarketplaceService` with:

- `create_demand`
- `list_demands`
- `get_demand`
- `cancel_demand`
- `create_offer`
- `list_offers`
- `accept_offer`
- `update_offer_status`
- `list_orders`
- `get_order_with_events`
- `transition_order`

Rules:

- Only open demands can receive offers.
- A provider cannot have more than one submitted/accepted offer for one demand.
- Only demand owner can accept or cancel a demand.
- Accepting an offer sets accepted offer to `accepted`, other submitted offers to `rejected`, demand to `matched`, and creates an order with status `pending_payment`.
- Order transitions use `OrderStateService`; invalid transitions raise `MarketplaceServiceError`.
- Transition to `serving` sets demand `in_service`; transition to `completed` sets demand `completed`; transition to `cancelled` sets demand `cancelled`.

- [ ] **Step 3: Verify service tests**

Run:

```bash
docker compose build python-service
docker compose run --rm python-service python -m pytest tests/services/test_marketplace_service.py -q
```

Expected: all service tests pass.

- [ ] **Step 4: Commit**

```bash
git add python-service/app/services/marketplace python-service/tests/services/test_marketplace_service.py
git commit -m "feat(python): add marketplace service"
```

## Task 3: Python Internal Marketplace API

**Files:**

- Create: `python-service/app/schemas/marketplace.py`
- Create: `python-service/app/api/internal/marketplace.py`
- Create: `python-service/tests/api/test_marketplace_api.py`
- Modify: `python-service/app/api/router.py`

- [ ] **Step 1: Write API tests**

Create tests for:

- `POST /internal/marketplace/demands`
- `GET /internal/marketplace/demands`
- `GET /internal/marketplace/demands/{id}`
- `POST /internal/marketplace/demands/{id}/cancel`
- `POST /internal/marketplace/demands/{id}/offers`
- `GET /internal/marketplace/demands/{id}/offers`
- `POST /internal/marketplace/offers/{id}/accept`
- `POST /internal/marketplace/offers/{id}/reject`
- `POST /internal/marketplace/offers/{id}/withdraw`
- `GET /internal/marketplace/orders`
- `GET /internal/marketplace/orders/{id}`
- `POST /internal/marketplace/orders/{id}/transition`

Use `headers = {"X-Internal-Token": settings.internal_api_token}`.

Assert writes are visible from a fresh DB session after the response. Assert invalid accept by non-owner returns `403`; duplicate active offer returns `409`; invalid order transition returns `409`.

- [ ] **Step 2: Implement schemas**

Create DTOs:

- `LocationPointDTO`
- `DemandCreateRequest`
- `DemandListResponse`
- `DemandResponse`
- `OfferCreateRequest`
- `OfferResponse`
- `AcceptOfferRequest`
- `AcceptOfferResponse`
- `OrderResponse`
- `OrderEventResponse`
- `OrderDetailResponse`
- `OrderTransitionRequest`

All response DTOs should use `ConfigDict(from_attributes=True)` where they wrap ORM objects. Response field names remain snake_case for Python; `PythonClient` converts to camelCase for BFF.

- [ ] **Step 3: Implement router**

Use:

```python
router = APIRouter(dependencies=[Depends(verify_internal_token)])
```

Map service errors:

- not found -> 404
- forbidden -> 403
- conflict or invalid status -> 409
- validation/input errors -> 422

Commit after successful writes.

- [ ] **Step 4: Mount router**

Modify `python-service/app/api/router.py`:

```python
from app.api.internal import identity, marketplace, profiles
api_router.include_router(marketplace.router, prefix="/internal/marketplace", tags=["internal-marketplace"])
```

- [ ] **Step 5: Verify API tests**

Run:

```bash
docker compose build python-service
docker compose run --rm python-service python -m pytest tests/api/test_marketplace_api.py -q
```

Expected: all marketplace API tests pass.

- [ ] **Step 6: Commit**

```bash
git add python-service/app/schemas/marketplace.py python-service/app/api/internal/marketplace.py python-service/app/api/router.py python-service/tests/api/test_marketplace_api.py
git commit -m "feat(python): add marketplace internal API"
```

## Task 4: TypeScript BFF Switch to Python Marketplace

**Files:**

- Create: `server/src/internal-dto/marketplace.ts`
- Modify: `server/src/services/python-client.ts`
- Modify: `server/src/modules/demands/routes.ts`
- Modify: `server/src/modules/offers/routes.ts`
- Modify: `server/src/modules/orders/routes.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Add TypeScript DTOs**

Define DTOs equivalent to `shared/demand.ts` and `shared/order.ts`, using camelCase at the TS boundary:

- `DemandCreateRequest`
- `DemandResponse`
- `DemandListResponse`
- `OfferCreateRequest`
- `OfferResponse`
- `AcceptOfferRequest`
- `AcceptOfferResponse`
- `OrderResponse`
- `OrderEventResponse`
- `OrderDetailResponse`
- `OrderTransitionRequest`

- [ ] **Step 2: Extend PythonClient**

Add:

- `createDemand`
- `listDemands`
- `getDemand`
- `cancelDemand`
- `createOffer`
- `listOffers`
- `acceptOffer`
- `updateOfferStatus`
- `listOrders`
- `getOrderDetail`
- `transitionOrder`

Add a private `get<TResponse>(path: string, query?: Record<string, string | undefined>)` method with `X-Internal-Token`.

- [ ] **Step 3: Switch demands router**

Change `createDemandsRouter` signature to:

```ts
export function createDemandsRouter(pythonClient: PythonClient): Router
```

Keep all route paths and HTTP status codes the same. On `PythonClientError`, return `{ error: error.message, details: error.details }` with Python status code.

- [ ] **Step 4: Switch offers router**

Change `createOffersRouter` signature to:

```ts
export function createOffersRouter(pythonClient: PythonClient): Router
```

Keep all route paths and status codes the same.

- [ ] **Step 5: Switch order marketplace reads/transitions**

Use Python for:

- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders/:id/confirm-arrival`
- `POST /api/orders/:id/start-service`
- `POST /api/orders/:id/complete`
- `POST /api/orders/:id/cancel`

Keep `/api/orders/snapshot` on the existing Python snapshot endpoint.

- [ ] **Step 6: Wire app**

Modify `server/src/app.ts`:

```ts
app.use(createDemandsRouter(pythonClient));
app.use(createOffersRouter(pythonClient));
app.use(createOrdersRouter(pythonClient, domainStore));
```

- [ ] **Step 7: Verify server build**

Run:

```bash
pnpm --filter ./server run build
```

Expected: TypeScript build passes.

- [ ] **Step 8: Commit**

```bash
git add server/src/internal-dto/marketplace.ts server/src/services/python-client.ts server/src/modules/demands/routes.ts server/src/modules/offers/routes.ts server/src/modules/orders/routes.ts server/src/app.ts
git commit -m "feat(server): route marketplace flow through python"
```

## Task 5: Phase 2 Verification

**Files:**

- Modify: `当前实施计划.md`

- [ ] **Step 1: Run Python full verification**

Run:

```bash
docker compose build python-service
docker compose run --rm python-service python -m compileall app migrations
docker compose run --rm python-service python -m pytest tests -q
```

Expected: compile succeeds and all Python tests pass.

- [ ] **Step 2: Run TypeScript builds**

Run:

```bash
pnpm --filter ./server run build
pnpm --filter ./client run build
```

Expected: both builds pass.

- [ ] **Step 3: Record results**

Append to `当前实施计划.md`:

```markdown
## 2026-05-13 Phase 2 验证结果

- Python compile：通过
- Python tests：通过
- Server build：通过
- Client build：通过
- 备注：Phase 2 将需求、报价、接受报价、订单生成和订单流转切换到 Python/PostgreSQL 主事实源。
```

- [ ] **Step 4: Commit and push branch**

```bash
git add 当前实施计划.md
git commit -m "docs: record phase 2 verification"
git push -u origin phase-2-marketplace-flow
```

## Self-Review Checklist

- Spec coverage: This plan implements Phase 2 only. Payment/refund/messages/navigation/H5 full screen work remains in later phases.
- Placeholder scan: No TBD/TODO steps remain; every task lists exact files and verification commands.
- Type consistency: BFF keeps camelCase public API; Python keeps snake_case internal DTOs; `PythonClient` converts both directions.
- Safety: Work runs in `.worktrees/phase-2-marketplace-flow`, based on the verified Phase 1 branch.
