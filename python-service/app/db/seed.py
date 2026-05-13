from copy import deepcopy
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.provider_profile import ProviderProfile
from app.models.user import User
from app.models.vehicle_profile import VehicleProfile
from app.repositories.projections import (
    ProviderProjection,
    ReviewProjection,
    ServiceFeedbackProjection,
    VehicleProjection,
)


NOW = datetime(2026, 4, 29, 12, 0, tzinfo=timezone.utc)


SAMPLE_PROVIDERS = [
    ProviderProjection(
        user_id="11111111-1111-4111-8111-111111111111",
        nickname="阿桃照护",
        phone="13800000001",
        avatar="🐱",
        role="provider",
        verified=True,
        status="approved",
        services=["buddy", "feeding", "cleaning", "medication", "multi_day_care"],
        intro="长期照护猫咪，擅长喂药与多猫家庭服务。",
        service_radius_km=8,
        base_district="拱墅区",
        score=4.92,
        completed_order_count=128,
        cat_care_score=4.95,
        communication_score=4.8,
        punctuality_score=4.9,
        emergency_handling_score=4.7,
        supports_home_visit=True,
        supports_medication=True,
        supports_multi_day_care=True,
        supports_emergency_order=True,
        cat_care_tags=["喂药熟练", "多猫家庭", "拍照细致"],
        lat=30.3205,
        lng=120.1507,
    ),
    ProviderProjection(
        user_id="22222222-2222-4222-8222-222222222222",
        nickname="西湖猫管家",
        phone="13800000002",
        avatar="😺",
        role="provider",
        verified=True,
        status="approved",
        services=["buddy", "feeding", "playtime", "temporary_care"],
        intro="更适合常规喂养、陪玩和短时看护。",
        service_radius_km=6,
        base_district="西湖区",
        score=4.58,
        completed_order_count=56,
        cat_care_score=4.5,
        communication_score=4.6,
        punctuality_score=4.55,
        emergency_handling_score=4.2,
        supports_home_visit=True,
        supports_medication=False,
        supports_multi_day_care=False,
        supports_emergency_order=False,
        cat_care_tags=["新手友好", "陪玩活跃"],
        lat=30.2598,
        lng=120.1268,
    ),
    ProviderProjection(
        user_id="33333333-3333-4333-8333-333333333333",
        nickname="喵行司机老周",
        phone="13800000003",
        avatar="🚗",
        role="provider",
        verified=True,
        status="approved",
        services=["ride", "pet_friendly_taxi", "escort"],
        intro="接送猫咪去医院和机场经验丰富。",
        service_radius_km=15,
        base_district="滨江区",
        score=4.86,
        completed_order_count=211,
        pet_friendly_score=4.95,
        driving_stability_score=4.88,
        cleanliness_score=4.82,
        punctuality_score=4.75,
        supports_emergency_order=True,
        cat_care_tags=["医院接送", "夜间可约"],
        vehicles=[
            VehicleProjection(
                id="aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
                user_id="33333333-3333-4333-8333-333333333333",
                vehicle_type="suv",
                plate_masked="浙A***9Q",
                seats=4,
                trunk_level="large",
                supports_cat_bag=True,
                supports_crate=True,
                supports_stroller=True,
                supports_multi_pet=True,
                pet_friendly=True,
                pet_friendly_tags=["大空间", "可放航空箱"],
            )
        ],
        lat=30.2051,
        lng=120.2108,
    ),
    ProviderProjection(
        user_id="44444444-4444-4444-8444-444444444444",
        nickname="余杭顺路车",
        phone="13800000004",
        avatar="🚙",
        role="provider",
        verified=True,
        status="approved",
        services=["taxi", "ride"],
        intro="适合同城短途顺路接送。",
        service_radius_km=12,
        base_district="余杭区",
        score=4.39,
        completed_order_count=74,
        pet_friendly_score=4.2,
        driving_stability_score=4.35,
        cleanliness_score=4.18,
        punctuality_score=4.22,
        vehicles=[
            VehicleProjection(
                id="aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
                user_id="44444444-4444-4444-8444-444444444444",
                vehicle_type="comfort",
                plate_masked="浙A***3M",
                seats=4,
                trunk_level="medium",
                supports_cat_bag=True,
                supports_crate=False,
                supports_stroller=False,
                supports_multi_pet=False,
                pet_friendly=False,
                pet_friendly_tags=[],
            )
        ],
        lat=30.2736,
        lng=120.0558,
    ),
    ProviderProjection(
        user_id="55555555-5555-4555-8555-555555555555",
        nickname="咪咪全能搭子",
        phone="13800000005",
        avatar="🐾",
        role="provider",
        verified=True,
        status="approved",
        services=["buddy", "feeding", "ride", "pet_friendly_taxi", "escort"],
        intro="既能照护也能开车接送，适合复合型需求。",
        service_radius_km=10,
        base_district="拱墅区",
        score=4.75,
        completed_order_count=142,
        cat_care_score=4.7,
        communication_score=4.68,
        punctuality_score=4.72,
        emergency_handling_score=4.6,
        pet_friendly_score=4.74,
        driving_stability_score=4.7,
        cleanliness_score=4.65,
        supports_home_visit=True,
        supports_medication=True,
        supports_multi_day_care=False,
        supports_emergency_order=True,
        cat_care_tags=["复合服务", "临时加急"],
        vehicles=[
            VehicleProjection(
                id="aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
                user_id="55555555-5555-4555-8555-555555555555",
                vehicle_type="business_van",
                plate_masked="浙A***8K",
                seats=6,
                trunk_level="large",
                supports_cat_bag=True,
                supports_crate=True,
                supports_stroller=True,
                supports_multi_pet=True,
                pet_friendly=True,
                pet_friendly_tags=["多宠同行", "车内通风好"],
            )
        ],
        lat=30.3172,
        lng=120.1439,
    ),
]


SAMPLE_REVIEWS = [
    ReviewProjection(
        reviewee_user_id="11111111-1111-4111-8111-111111111111",
        overall_score=4.95,
        cat_care_score=5.0,
        punctuality_score=4.9,
        communication_score=4.8,
        feedback_completeness_score=4.9,
        medication_accuracy_score=5.0,
        tags=["喂药专业", "沟通及时", "多猫放心"],
        created_at=NOW - timedelta(days=4),
    ),
    ReviewProjection(
        reviewee_user_id="11111111-1111-4111-8111-111111111111",
        overall_score=4.85,
        cat_care_score=4.9,
        punctuality_score=4.8,
        communication_score=4.7,
        feedback_completeness_score=4.8,
        medication_accuracy_score=4.9,
        tags=["反馈细致", "按时到达"],
        created_at=NOW - timedelta(days=9),
    ),
    ReviewProjection(
        reviewee_user_id="22222222-2222-4222-8222-222222222222",
        overall_score=4.42,
        cat_care_score=4.45,
        punctuality_score=4.4,
        communication_score=4.5,
        tags=["陪玩积极"],
        created_at=NOW - timedelta(days=12),
    ),
    ReviewProjection(
        reviewee_user_id="33333333-3333-4333-8333-333333333333",
        overall_score=4.92,
        pet_friendly_score=5.0,
        driving_stability_score=4.85,
        punctuality_score=4.8,
        cleanliness_score=4.82,
        tags=["对宠物耐心", "车里干净", "航空箱友好"],
        created_at=NOW - timedelta(days=5),
    ),
    ReviewProjection(
        reviewee_user_id="33333333-3333-4333-8333-333333333333",
        overall_score=4.78,
        pet_friendly_score=4.9,
        driving_stability_score=4.7,
        punctuality_score=4.65,
        cleanliness_score=4.8,
        tags=["夜间接送稳"],
        created_at=NOW - timedelta(days=16),
    ),
    ReviewProjection(
        reviewee_user_id="44444444-4444-4444-8444-444444444444",
        overall_score=4.18,
        pet_friendly_score=4.0,
        driving_stability_score=4.2,
        punctuality_score=4.15,
        cleanliness_score=4.1,
        tags=["价格实惠"],
        created_at=NOW - timedelta(days=22),
    ),
    ReviewProjection(
        reviewee_user_id="55555555-5555-4555-8555-555555555555",
        overall_score=4.76,
        cat_care_score=4.7,
        pet_friendly_score=4.75,
        driving_stability_score=4.68,
        punctuality_score=4.74,
        cleanliness_score=4.6,
        communication_score=4.7,
        feedback_completeness_score=4.65,
        medication_accuracy_score=4.7,
        tags=["临时单也靠谱", "响应快"],
        created_at=NOW - timedelta(days=3),
    ),
]


SAMPLE_FEEDBACKS = [
    ServiceFeedbackProjection(
        order_id="feed-001",
        provider_user_id="11111111-1111-4111-8111-111111111111",
        photo_urls=["https://example.com/feed1/a.jpg", "https://example.com/feed1/b.jpg"],
        video_urls=["https://example.com/feed1/a.mp4"],
        created_at=NOW - timedelta(days=7),
    ),
    ServiceFeedbackProjection(
        order_id="feed-002",
        provider_user_id="11111111-1111-4111-8111-111111111111",
        photo_urls=["https://example.com/feed2/a.jpg"],
        video_urls=[],
        created_at=NOW - timedelta(days=2),
    ),
    ServiceFeedbackProjection(
        order_id="feed-003",
        provider_user_id="55555555-5555-4555-8555-555555555555",
        photo_urls=["https://example.com/feed3/a.jpg"],
        video_urls=["https://example.com/feed3/a.mp4"],
        created_at=NOW - timedelta(days=6),
    ),
]


def load_sample_providers() -> list[ProviderProjection]:
    return deepcopy(SAMPLE_PROVIDERS)


def load_sample_reviews() -> list[ReviewProjection]:
    return deepcopy(SAMPLE_REVIEWS)


def load_sample_feedbacks() -> list[ServiceFeedbackProjection]:
    return deepcopy(SAMPLE_FEEDBACKS)


def seed_sample_providers(db: Session) -> None:
    for provider in load_sample_providers():
        provider_id = UUID(provider.user_id)
        db.execute(
            insert(User)
            .values(
                id=provider_id,
                phone=provider.phone,
                nickname=provider.nickname,
                avatar=provider.avatar,
                role="provider",
                verified=provider.verified,
            )
            .on_conflict_do_update(
                index_elements=[User.id],
                set_={
                    "phone": provider.phone,
                    "nickname": provider.nickname,
                    "avatar": provider.avatar,
                    "role": "provider",
                    "verified": provider.verified,
                },
            )
        )
        db.execute(
            insert(ProviderProfile)
            .values(
                user_id=provider_id,
                status=provider.status,
                services=provider.services,
                intro=provider.intro,
                service_radius_km=provider.service_radius_km,
                base_district=provider.base_district,
                score=provider.score,
                completed_order_count=provider.completed_order_count,
                cat_care_score=provider.cat_care_score,
                communication_score=provider.communication_score,
                punctuality_score=provider.punctuality_score,
                emergency_handling_score=provider.emergency_handling_score,
                pet_friendly_score=provider.pet_friendly_score,
                driving_stability_score=provider.driving_stability_score,
                cleanliness_score=provider.cleanliness_score,
                supports_home_visit=provider.supports_home_visit,
                supports_medication=provider.supports_medication,
                supports_multi_day_care=provider.supports_multi_day_care,
                supports_emergency_order=provider.supports_emergency_order,
                cat_care_tags=provider.cat_care_tags,
                accepting_orders=True,
                service_time_slots=[],
            )
            .on_conflict_do_update(
                index_elements=[ProviderProfile.user_id],
                set_={
                    "status": provider.status,
                    "services": provider.services,
                    "intro": provider.intro,
                    "service_radius_km": provider.service_radius_km,
                    "base_district": provider.base_district,
                    "score": provider.score,
                    "completed_order_count": provider.completed_order_count,
                    "cat_care_score": provider.cat_care_score,
                    "communication_score": provider.communication_score,
                    "punctuality_score": provider.punctuality_score,
                    "emergency_handling_score": provider.emergency_handling_score,
                    "pet_friendly_score": provider.pet_friendly_score,
                    "driving_stability_score": provider.driving_stability_score,
                    "cleanliness_score": provider.cleanliness_score,
                    "supports_home_visit": provider.supports_home_visit,
                    "supports_medication": provider.supports_medication,
                    "supports_multi_day_care": provider.supports_multi_day_care,
                    "supports_emergency_order": provider.supports_emergency_order,
                    "cat_care_tags": provider.cat_care_tags,
                    "accepting_orders": True,
                    "service_time_slots": [],
                },
            )
        )
        for vehicle in provider.vehicles:
            db.execute(
                insert(VehicleProfile)
                .values(
                    id=UUID(vehicle.id),
                    user_id=UUID(vehicle.user_id),
                    vehicle_type=vehicle.vehicle_type,
                    plate_masked=vehicle.plate_masked,
                    seats=vehicle.seats,
                    trunk_level=vehicle.trunk_level,
                    supports_cat_bag=vehicle.supports_cat_bag,
                    supports_crate=vehicle.supports_crate,
                    supports_stroller=vehicle.supports_stroller,
                    supports_multi_pet=vehicle.supports_multi_pet,
                    pet_friendly=vehicle.pet_friendly,
                    pet_friendly_tags=vehicle.pet_friendly_tags,
                )
                .on_conflict_do_update(
                    index_elements=[VehicleProfile.id],
                    set_={
                        "user_id": UUID(vehicle.user_id),
                        "vehicle_type": vehicle.vehicle_type,
                        "plate_masked": vehicle.plate_masked,
                        "seats": vehicle.seats,
                        "trunk_level": vehicle.trunk_level,
                        "supports_cat_bag": vehicle.supports_cat_bag,
                        "supports_crate": vehicle.supports_crate,
                        "supports_stroller": vehicle.supports_stroller,
                        "supports_multi_pet": vehicle.supports_multi_pet,
                        "pet_friendly": vehicle.pet_friendly,
                        "pet_friendly_tags": vehicle.pet_friendly_tags,
                    },
                )
            )
