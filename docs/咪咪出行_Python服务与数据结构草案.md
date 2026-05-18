# 咪咪出行 Python 服务与数据结构草案

## 1. 文档目标

本文档补充以下几部分落地草案：

- `python-service` 目录结构草案
- TypeScript 后端到 Python 后端的 DTO 定义草案
- PostgreSQL 表结构初稿
- SQLAlchemy 模型草案
- Alembic 迁移落地草案
- 消息会话模型细化

默认架构前提：

- 前端只调用 TypeScript 后端
- TypeScript 后端作为 BFF / API Gateway
- Python 后端作为领域服务层
- PostgreSQL 作为 Python 领域层主数据库

## 2. `python-service` 目录结构草案

建议目录如下：

```text
python-service/
  app/
    main.py
    config/
      settings.py
      logging.py
      security.py
    api/
      deps.py
      router.py
      internal/
        matching.py
        reviews.py
        pricing.py
        risk.py
        orders.py
    schemas/
      common.py
      demand.py
      provider.py
      matching.py
      review.py
      pricing.py
      risk.py
      order.py
    models/
      base.py
      user.py
      provider_profile.py
      vehicle_profile.py
      pet.py
      demand.py
      offer.py
      order.py
      payment.py
      refund.py
      conversation.py
      message.py
      review.py
      service_feedback.py
      location_snapshot.py
      order_event.py
      recommendation_snapshot.py
      risk_decision.py
    repositories/
      user_repo.py
      provider_repo.py
      demand_repo.py
      offer_repo.py
      order_repo.py
      payment_repo.py
      review_repo.py
      feedback_repo.py
      recommendation_repo.py
    services/
      matching/
        caregiver_match_service.py
        driver_match_service.py
        scoring.py
      reviews/
        provider_review_summary_service.py
        tags_aggregation_service.py
      pricing/
        quote_service.py
        surcharge_rules.py
      risk/
        prepay_check_service.py
        fraud_rules.py
      orders/
        snapshot_service.py
        order_state_service.py
      profiles/
        provider_profile_service.py
        vehicle_profile_service.py
    rules/
      caregiver_rules.py
      driver_rules.py
      pricing_rules.py
      refund_rules.py
      risk_rules.py
    db/
      session.py
      seed.py
    workers/
      celery_app.py
      review_rebuild_job.py
      recommendation_refresh_job.py
      payment_reconcile_job.py
    utils/
      ids.py
      clock.py
      geo.py
      money.py
      pagination.py
      signature.py
  migrations/
    versions/
  tests/
    api/
    services/
    repositories/
    fixtures/
  scripts/
    dev.sh
    lint.sh
    test.sh
  requirements.txt
  pyproject.toml
  alembic.ini
  README.md
```

当前仓库已按该思路生成了第一版工程骨架，目录位于 [python-service](/Users/codsevita/Documents/GitHub/mimi_travel/python-service)。

## 3. 分层说明

### 3.1 `api/`

- 只暴露内部接口给 TS 后端使用
- 不直接暴露前端页面级语义
- 输入输出应稳定，避免直接返回数据库实体

### 3.2 `schemas/`

- 使用 Pydantic 定义请求和响应 DTO
- 区分内部请求 DTO、内部响应 DTO、领域结构 DTO

### 3.3 `models/`

- 使用 SQLAlchemy / SQLModel 定义数据库实体
- 专注于持久化结构，不承担复杂业务逻辑

### 3.4 `repositories/`

- 负责数据库 CRUD
- 不写复杂业务规则

### 3.5 `services/`

- 实现业务规则、排序、聚合、状态推进
- 可组合多个 repository 完成完整逻辑

### 3.6 `rules/`

- 提取可配置规则
- 方便后续把权重、阈值、是否允许接单等策略独立管理

### 3.7 `workers/`

- 执行异步重算任务
- 适合评价聚合、推荐刷新、补单、对账

## 4. TS 到 Python 的 DTO 定义草案

这里的 DTO 指“TS 后端内部请求 Python 服务时的结构”，不直接等于前端请求结构，也不直接等于数据库表结构。

建议在 TS 侧新增：

```text
server/src/internal-dto/
  common.ts
  matching.ts
  reviews.ts
  pricing.ts
  risk.ts
  orders.ts
```

建议在 Python 侧新增对应 Pydantic schema：

```text
python-service/app/schemas/
  matching.py
  reviews.py
  pricing.py
  risk.py
  order.py
```

### 4.1 通用 DTO

```ts
export interface InternalRequestMeta {
  requestId: string;
  traceId?: string;
  operatorUserId?: string;
  source: 'ts-bff';
  timestamp: string;
}
```

```py
class InternalRequestMeta(BaseModel):
    request_id: str
    trace_id: str | None = None
    operator_user_id: str | None = None
    source: Literal["ts-bff"]
    timestamp: datetime
```

### 4.2 摇人陪咪匹配 DTO

TS 请求：

```ts
export interface CaregiverMatchRequest {
  meta: InternalRequestMeta;
  demand: {
    id: string;
    userId: string;
    district?: string;
    serviceType:
      | 'buddy'
      | 'feeding'
      | 'cleaning'
      | 'playtime'
      | 'temporary_care'
      | 'hospital'
      | 'medication'
      | 'multi_day_care'
      | 'grooming_pickup';
    budgetMin: number;
    budgetMax: number;
    serviceTime: string;
    pickup?: {
      lat: number;
      lng: number;
      address: string;
    };
    careRequirements?: {
      needHomeVisit?: boolean;
      needCleaning?: boolean;
      needMedication?: boolean;
      needPhotoFeedback?: boolean;
      needVideoFeedback?: boolean;
      needMultiDayCare?: boolean;
      visitTimesPerDay?: number;
      estimatedDurationMinutes?: number;
      hasMultiplePets?: boolean;
      caregiverPreference?: 'any' | 'male' | 'female';
      requireCatCareExperience?: boolean;
    };
  };
  page?: number;
  pageSize?: number;
}
```

Python 返回：

```ts
export interface CaregiverMatchCandidate {
  providerUserId: string;
  score: number;
  distanceKm?: number;
  reasons: string[];
  priceHintMin?: number;
  priceHintMax?: number;
  profileSnapshot: {
    nickname: string;
    avatar: string;
    catCareScore?: number;
    communicationScore?: number;
    punctualityScore?: number;
    tags: string[];
    completedOrderCount: number;
    supportsHomeVisit?: boolean;
    supportsMedication?: boolean;
    supportsMultiDayCare?: boolean;
  };
}

export interface CaregiverMatchResponse {
  requestId: string;
  candidates: CaregiverMatchCandidate[];
}
```

### 4.3 宠物友好司机匹配 DTO

TS 请求：

```ts
export interface DriverMatchRequest {
  meta: InternalRequestMeta;
  demand: {
    id: string;
    userId: string;
    district?: string;
    serviceType: 'taxi' | 'ride' | 'pet_friendly_taxi' | 'carpool' | 'escort';
    budgetMin: number;
    budgetMax: number;
    serviceTime: string;
    pickup?: {
      lat: number;
      lng: number;
      address: string;
    };
    destination?: {
      lat: number;
      lng: number;
      address: string;
    };
    rideRequirements?: {
      petCount?: number;
      petSize?: 'small' | 'medium' | 'large';
      carrierType?: 'none' | 'cat_bag' | 'crate' | 'stroller';
      acceptNormalTaxi?: boolean;
      requirePetFriendlyVehicle?: boolean;
      requireLargeTrunk?: boolean;
      requireStableDriving?: boolean;
      requireLowOdor?: boolean;
    };
  };
  page?: number;
  pageSize?: number;
}
```

Python 返回：

```ts
export interface DriverMatchCandidate {
  providerUserId: string;
  vehicleId?: string;
  score: number;
  distanceKm?: number;
  etaMinutes?: number;
  reasons: string[];
  profileSnapshot: {
    nickname: string;
    avatar: string;
    petFriendlyScore?: number;
    drivingStabilityScore?: number;
    cleanlinessScore?: number;
    punctualityScore?: number;
    tags: string[];
    completedOrderCount: number;
  };
  vehicleSnapshot?: {
    vehicleType: 'economy' | 'comfort' | 'suv' | 'business_van';
    trunkLevel: 'small' | 'medium' | 'large';
    supportsCatBag: boolean;
    supportsCrate: boolean;
    supportsStroller: boolean;
    supportsMultiPet: boolean;
    petFriendly: boolean;
    petFriendlyTags: string[];
  };
}

export interface DriverMatchResponse {
  requestId: string;
  candidates: DriverMatchCandidate[];
}
```

### 4.4 评价聚合 DTO

TS 请求：

```ts
export interface ProviderReviewSummaryRequest {
  meta: InternalRequestMeta;
  providerUserId: string;
}
```

Python 返回：

```ts
export interface ProviderReviewSummaryResponse {
  requestId: string;
  providerUserId: string;
  overallScore: number;
  reviewCount: number;
  catCareScore?: number;
  petFriendlyScore?: number;
  drivingStabilityScore?: number;
  punctualityScore?: number;
  cleanlinessScore?: number;
  communicationScore?: number;
  feedbackCompletenessScore?: number;
  medicationAccuracyScore?: number;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
}
```

### 4.5 支付前风控 DTO

TS 请求：

```ts
export interface PrepayRiskCheckRequest {
  meta: InternalRequestMeta;
  order: {
    id: string;
    buyerUserId: string;
    sellerUserId: string;
    amountFen: number;
    serviceType: string;
    district?: string;
  };
  payment: {
    channel: 'alipay' | 'wechat_pay';
    scene: 'deposit' | 'full' | 'balance';
  };
}
```

Python 返回：

```ts
export interface PrepayRiskCheckResponse {
  requestId: string;
  allowed: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasonCodes: string[];
  humanMessage?: string;
}
```

### 4.6 报价计算 DTO

TS 请求：

```ts
export interface PricingQuoteRequest {
  meta: InternalRequestMeta;
  demand: {
    serviceType: string;
    district?: string;
    budgetMin?: number;
    budgetMax?: number;
    careRequirements?: Record<string, unknown>;
    rideRequirements?: Record<string, unknown>;
  };
  provider?: {
    providerUserId: string;
    vehicleId?: string;
  };
}
```

Python 返回：

```ts
export interface PricingQuoteResponse {
  requestId: string;
  amountFen: number;
  breakdown: Array<{
    code: string;
    label: string;
    amountFen: number;
  }>;
}
```

### 4.7 订单快照 DTO

TS 请求：

```ts
export interface OrderSnapshotRequest {
  meta: InternalRequestMeta;
  orderId: string;
  providerUserId: string;
  vehicleId?: string;
}
```

Python 返回：

```ts
export interface OrderSnapshotResponse {
  requestId: string;
  orderId: string;
  caregiverSnapshot?: {
    userId: string;
    nickname: string;
    avatar: string;
    catCareScore?: number;
    tags: string[];
    supportsMedication?: boolean;
    supportsMultiDayCare?: boolean;
  };
  driverSnapshot?: {
    userId: string;
    nickname: string;
    avatar: string;
    petFriendlyScore?: number;
    tags: string[];
    vehicleType?: string;
  };
}
```

## 5. PostgreSQL 表结构初稿

以下结构以 PostgreSQL 15+ 为目标，默认启用：

- `pgcrypto`
- 后续如需要地理能力，可加 `postgis`

### 5.1 基础约定

- 主键使用 `uuid`
- 金额统一用 `bigint`，单位 `fen`
- 时间统一用 `timestamptz`
- 灵活结构用 `jsonb`
- 状态字段保留 `varchar`，避免早期枚举迁移成本过高

### 5.2 `users`

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  nickname varchar(64) not null,
  phone varchar(32) not null unique,
  avatar text,
  role varchar(32) not null default 'customer',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5.3 `provider_profiles`

```sql
create table provider_profiles (
  user_id uuid primary key references users(id),
  status varchar(32) not null default 'pending',
  services jsonb not null default '[]'::jsonb,
  intro text,
  service_radius_km integer not null default 5,
  base_district varchar(64),
  score numeric(4,2),
  completed_order_count integer not null default 0,
  cat_care_score numeric(4,2),
  communication_score numeric(4,2),
  punctuality_score numeric(4,2),
  emergency_handling_score numeric(4,2),
  pet_friendly_score numeric(4,2),
  driving_stability_score numeric(4,2),
  cleanliness_score numeric(4,2),
  supports_home_visit boolean,
  supports_medication boolean,
  supports_multi_day_care boolean,
  supports_emergency_order boolean,
  cat_care_tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5.4 `vehicle_profiles`

```sql
create table vehicle_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  vehicle_type varchar(32) not null,
  plate_masked varchar(32) not null,
  seats integer not null,
  trunk_level varchar(16),
  supports_cat_bag boolean not null default false,
  supports_crate boolean not null default false,
  supports_stroller boolean not null default false,
  supports_multi_pet boolean not null default false,
  pet_friendly boolean not null default false,
  pet_friendly_tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_vehicle_profiles_user_id on vehicle_profiles(user_id);
```

### 5.5 `pets`

```sql
create table pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  name varchar(64) not null,
  breed varchar(64),
  weight varchar(32),
  vaccine varchar(128),
  certificate varchar(128),
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pets_user_id on pets(user_id);
```

### 5.6 `demands`

```sql
create table demands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  service_type varchar(64) not null,
  title varchar(128) not null,
  description text,
  pet_summary text,
  budget_min_fen bigint,
  budget_max_fen bigint,
  expected_price_fen bigint,
  contact_name varchar(64),
  contact_phone varchar(32),
  allow_bargain boolean not null default false,
  visibility_radius_km integer not null default 5,
  district varchar(64),
  pickup jsonb,
  destination jsonb,
  care_requirements jsonb,
  ride_requirements jsonb,
  service_time timestamptz,
  status varchar(32) not null default 'open',
  selected_offer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_demands_user_id on demands(user_id);
create index idx_demands_service_type on demands(service_type);
create index idx_demands_status on demands(status);
create index idx_demands_created_at on demands(created_at desc);
```

### 5.7 `offers`

```sql
create table offers (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references demands(id),
  provider_user_id uuid not null references users(id),
  quote_amount_fen bigint not null,
  message text,
  eta_minutes integer,
  vehicle_id uuid references vehicle_profiles(id),
  service_plan text,
  status varchar(32) not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_offers_demand_id on offers(demand_id);
create index idx_offers_provider_user_id on offers(provider_user_id);
```

### 5.8 `orders`

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references demands(id),
  buyer_user_id uuid not null references users(id),
  seller_user_id uuid not null references users(id),
  title varchar(128) not null,
  amount_fen bigint not null,
  deposit_fen bigint,
  status varchar(32) not null default 'pending_payment',
  service_time timestamptz,
  pickup jsonb,
  destination jsonb,
  vehicle_id uuid references vehicle_profiles(id),
  driver_snapshot jsonb,
  caregiver_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_buyer_user_id on orders(buyer_user_id);
create index idx_orders_seller_user_id on orders(seller_user_id);
create index idx_orders_status on orders(status);
```

### 5.9 `payments`

```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  channel varchar(32) not null,
  scene varchar(32) not null,
  amount_fen bigint not null,
  currency varchar(8) not null default 'CNY',
  status varchar(32) not null default 'created',
  out_trade_no varchar(64) not null unique,
  provider_trade_no varchar(128),
  raw_notify text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_order_id on payments(order_id);
create index idx_payments_status on payments(status);
```

### 5.10 `refunds`

```sql
create table refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id),
  order_id uuid not null references orders(id),
  refund_amount_fen bigint not null,
  status varchar(32) not null default 'pending',
  provider_refund_no varchar(128),
  reason varchar(256),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_refunds_payment_id on refunds(payment_id);
create index idx_refunds_order_id on refunds(order_id);
```

### 5.11 `conversations`

```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid references demands(id),
  order_id uuid references orders(id),
  participant_user_ids jsonb not null default '[]'::jsonb,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5.12 `messages`

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id),
  sender_user_id uuid not null references users(id),
  type varchar(32) not null,
  content text not null,
  related_demand_id uuid references demands(id),
  created_at timestamptz not null default now()
);

create index idx_messages_conversation_id on messages(conversation_id);
create index idx_messages_created_at on messages(created_at desc);
```

### 5.13 `reviews`

```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  reviewer_user_id uuid not null references users(id),
  reviewee_user_id uuid not null references users(id),
  overall_score numeric(4,2) not null,
  cat_care_score numeric(4,2),
  pet_friendly_score numeric(4,2),
  driving_stability_score numeric(4,2),
  punctuality_score numeric(4,2),
  cleanliness_score numeric(4,2),
  communication_score numeric(4,2),
  feedback_completeness_score numeric(4,2),
  medication_accuracy_score numeric(4,2),
  supports_pet_handling_score numeric(4,2),
  tags jsonb not null default '[]'::jsonb,
  content text,
  created_at timestamptz not null default now()
);

create index idx_reviews_reviewee_user_id on reviews(reviewee_user_id);
create index idx_reviews_order_id on reviews(order_id);
```

### 5.14 `service_feedbacks`

```sql
create table service_feedbacks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  provider_user_id uuid not null references users(id),
  arrived_at timestamptz,
  left_at timestamptz,
  note text,
  photo_urls jsonb not null default '[]'::jsonb,
  video_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_service_feedbacks_order_id on service_feedbacks(order_id);
```

### 5.15 `location_snapshots`

```sql
create table location_snapshots (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  user_id uuid references users(id),
  lat numeric(10,7) not null,
  lng numeric(10,7) not null,
  address text,
  coord_system varchar(16) not null default 'gcj02',
  created_at timestamptz not null default now()
);

create index idx_location_snapshots_order_id on location_snapshots(order_id);
create index idx_location_snapshots_user_id on location_snapshots(user_id);
```

### 5.16 `order_events`

```sql
create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  event_type varchar(64) not null,
  operator_user_id uuid references users(id),
  payload jsonb,
  created_at timestamptz not null default now()
);

create index idx_order_events_order_id on order_events(order_id);
create index idx_order_events_created_at on order_events(created_at desc);
```

### 5.17 `recommendation_snapshots`

```sql
create table recommendation_snapshots (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references demands(id),
  recommendation_type varchar(32) not null,
  candidate_user_id uuid not null references users(id),
  score numeric(8,4) not null,
  reason_codes jsonb not null default '[]'::jsonb,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_recommendation_snapshots_demand_id on recommendation_snapshots(demand_id);
```

### 5.18 `risk_decisions`

```sql
create table risk_decisions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  payment_id uuid references payments(id),
  decision_type varchar(32) not null,
  allowed boolean not null,
  risk_level varchar(16) not null,
  reason_codes jsonb not null default '[]'::jsonb,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index idx_risk_decisions_order_id on risk_decisions(order_id);
create index idx_risk_decisions_payment_id on risk_decisions(payment_id);
```

## 6. SQLAlchemy 模型草案

当前建议采用：

- SQLAlchemy 2.x Declarative
- `Mapped[...]` + `mapped_column(...)`
- `UUID(as_uuid=True)` 作为主键
- `jsonb` 承载灵活字段和快照

### 6.1 基础 Base 草案

建议统一一个 `Base`、一个 `UUIDPrimaryKeyMixin`、一个 `TimestampMixin`，用于：

- 所有实体继承同一 metadata
- 统一命名约定
- 统一时间字段和 UUID 主键

当前骨架文件：

- [base.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/base.py)

### 6.2 核心模型映射文件

当前骨架已经生成以下模型草案：

- [user.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/user.py)
- [provider_profile.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/provider_profile.py)
- [vehicle_profile.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/vehicle_profile.py)
- [pet.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/pet.py)
- [demand.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/demand.py)
- [offer.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/offer.py)
- [order.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/order.py)
- [payment.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/payment.py)
- [refund.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/refund.py)
- [conversation.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/conversation.py)
- [message.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/message.py)
- [review.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/review.py)
- [service_feedback.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/service_feedback.py)
- [order_event.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/order_event.py)

### 6.3 需要继续补的模型

下一步建议继续补：

- `location_snapshot.py`
- `recommendation_snapshot.py`
- `risk_decision.py`

这三类模型当前已经在表结构初稿中定义，但还未在骨架中写出对应实体文件。

## 7. Alembic 迁移草案

当前骨架已生成：

- [alembic.ini](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/alembic.ini)
- [env.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/migrations/env.py)

建议第一条迁移命名：

```text
0001_init_core_tables
```

建议第一批迁移只包含：

- `users`
- `provider_profiles`
- `pets`
- `demands`
- `offers`
- `orders`
- `payments`
- `refunds`
- `order_events`

第二批再加入：

- `conversations`
- `messages`
- `reviews`
- `service_feedbacks`

第三批加入：

- `vehicle_profiles`
- `location_snapshots`
- `recommendation_snapshots`
- `risk_decisions`

原因：

- 第一批先把交易主链路打通
- 第二批补沟通与评价
- 第三批补画像、推荐和风控

## 8. 消息会话模型细化

消息系统不建议只用一个 `messages` 表硬扛所有语义，至少要明确“会话”和“消息”两层。

### 8.1 `conversations` 设计目标

会话承载：

- 参与者集合
- 关联的需求或订单
- 最近一条消息时间

建议用途：

- 需求刚发布时生成需求会话
- 服务者报价后生成用户与服务者的私有会话
- 订单成交后，会话升级为订单会话

当前骨架文件：

- [conversation.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/conversation.py)

建议后续增强字段：

- `conversation_type`：`demand` / `order` / `system`
- `status`：`active` / `closed`
- `last_message_preview`

### 8.2 `messages` 设计目标

消息承载：

- 文本消息
- 系统消息
- 报价消息
- 支付消息
- 定位消息
- 服务反馈消息

当前骨架文件：

- [message.py](/Users/codsevita/Documents/GitHub/mimi_travel/python-service/app/models/message.py)

建议后续增强字段：

- `payload jsonb`
- `read_state jsonb` 或单独 `message_reads` 表
- `client_msg_id` 便于前端去重

### 8.3 推荐的消息增强表

后续建议增加：

```sql
create table message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id),
  user_id uuid not null references users(id),
  read_at timestamptz not null default now()
);
```

适用原因：

- 已读状态天然是多对多关系
- 不建议把所有用户已读状态直接塞进 `messages.payload`

## 9. DTO 与模型边界提醒

必须保持以下边界：

- TS DTO 不等于 Python ORM 模型
- Python ORM 模型不直接返回给 TS
- Python API 层应使用 Pydantic schema 输出稳定结构
- 快照类字段允许使用 `jsonb`，但主关系不要全部塞入 `jsonb`

## 10. 当前已生成的骨架范围

本次已落地：

- `FastAPI` 入口和内部路由
- `Pydantic` schema 草案
- `SQLAlchemy` 核心模型草案
- `Alembic` 基础配置
- 消息会话模型第一版实体

尚未落地：

- 仓储实现
- 服务实现
- 规则引擎实现
- 第一条 Alembic migration 文件
- TS 侧 `PythonClient`

## 11. 建表优先级建议

第一批必须建：

- `users`
- `provider_profiles`
- `pets`
- `demands`
- `offers`
- `orders`
- `payments`
- `refunds`
- `order_events`

第二批建议建：

- `reviews`
- `service_feedbacks`
- `conversations`
- `messages`

第三批建议建：

- `vehicle_profiles`
- `location_snapshots`
- `recommendation_snapshots`
- `risk_decisions`

## 12. 当前项目落地建议

建议下一步按这个顺序推进：

1. 在根目录新增 `python-service/` 工程。
2. 先实现 `FastAPI + SQLAlchemy + Alembic + PostgreSQL` 基础设施。
3. 先落第一批核心表迁移。
4. 在 TS 侧定义内部 DTO 和 PythonClient。
5. 先打通两个内部接口：
   - `/internal/matching/caregivers`
   - `/internal/matching/drivers`
6. 再逐步扩展评价聚合、风控、定价和订单快照。
