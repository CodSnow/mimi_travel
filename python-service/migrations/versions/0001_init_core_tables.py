"""init core tables

Revision ID: 0001_init_core_tables
Revises:
Create Date: 2026-04-29
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0001_init_core_tables"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.execute("create extension if not exists pgcrypto")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("nickname", sa.String(length=64), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("avatar", sa.Text(), nullable=True),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="customer"),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("phone", name="uq_users_phone"),
    )

    op.create_table(
        "provider_profiles",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("services", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("intro", sa.Text(), nullable=True),
        sa.Column("service_radius_km", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("base_district", sa.String(length=64), nullable=True),
        sa.Column("score", sa.Numeric(4, 2), nullable=True),
        sa.Column("completed_order_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cat_care_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("communication_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("punctuality_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("emergency_handling_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("pet_friendly_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("driving_stability_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("cleanliness_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("supports_home_visit", sa.Boolean(), nullable=True),
        sa.Column("supports_medication", sa.Boolean(), nullable=True),
        sa.Column("supports_multi_day_care", sa.Boolean(), nullable=True),
        sa.Column("supports_emergency_order", sa.Boolean(), nullable=True),
        sa.Column("cat_care_tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "pets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("breed", sa.String(length=64), nullable=True),
        sa.Column("weight", sa.String(length=32), nullable=True),
        sa.Column("vaccine", sa.String(length=128), nullable=True),
        sa.Column("certificate", sa.String(length=128), nullable=True),
        sa.Column("avatar", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_pets_user_id", "pets", ["user_id"])

    op.create_table(
        "demands",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("service_type", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("pet_summary", sa.Text(), nullable=True),
        sa.Column("budget_min_fen", sa.BigInteger(), nullable=True),
        sa.Column("budget_max_fen", sa.BigInteger(), nullable=True),
        sa.Column("expected_price_fen", sa.BigInteger(), nullable=True),
        sa.Column("contact_name", sa.String(length=64), nullable=True),
        sa.Column("contact_phone", sa.String(length=32), nullable=True),
        sa.Column("allow_bargain", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("visibility_radius_km", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("district", sa.String(length=64), nullable=True),
        sa.Column("pickup", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("destination", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("care_requirements", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("ride_requirements", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("service_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("selected_offer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_demands_user_id", "demands", ["user_id"])
    op.create_index("idx_demands_service_type", "demands", ["service_type"])
    op.create_index("idx_demands_status", "demands", ["status"])
    op.create_index("idx_demands_created_at", "demands", [sa.text("created_at desc")])

    op.create_table(
        "offers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("demand_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("demands.id"), nullable=False),
        sa.Column("provider_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("quote_amount_fen", sa.BigInteger(), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("eta_minutes", sa.Integer(), nullable=True),
        sa.Column("vehicle_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("service_plan", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="submitted"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_offers_demand_id", "offers", ["demand_id"])
    op.create_index("idx_offers_provider_user_id", "offers", ["provider_user_id"])

    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("demand_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("demands.id"), nullable=False),
        sa.Column("buyer_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("seller_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(length=128), nullable=False),
        sa.Column("amount_fen", sa.BigInteger(), nullable=False),
        sa.Column("deposit_fen", sa.BigInteger(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending_payment"),
        sa.Column("service_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("pickup", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("destination", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("vehicle_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("driver_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("caregiver_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_orders_buyer_user_id", "orders", ["buyer_user_id"])
    op.create_index("idx_orders_seller_user_id", "orders", ["seller_user_id"])
    op.create_index("idx_orders_status", "orders", ["status"])

    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("channel", sa.String(length=32), nullable=False),
        sa.Column("scene", sa.String(length=32), nullable=False),
        sa.Column("amount_fen", sa.BigInteger(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="CNY"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="created"),
        sa.Column("out_trade_no", sa.String(length=64), nullable=False),
        sa.Column("provider_trade_no", sa.String(length=128), nullable=True),
        sa.Column("raw_notify", sa.Text(), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("out_trade_no", name="uq_payments_out_trade_no"),
    )
    op.create_index("idx_payments_order_id", "payments", ["order_id"])
    op.create_index("idx_payments_status", "payments", ["status"])

    op.create_table(
        "refunds",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("payments.id"), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("refund_amount_fen", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("provider_refund_no", sa.String(length=128), nullable=True),
        sa.Column("reason", sa.String(length=256), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_refunds_payment_id", "refunds", ["payment_id"])
    op.create_index("idx_refunds_order_id", "refunds", ["order_id"])

    op.create_table(
        "order_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("operator_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_order_events_order_id", "order_events", ["order_id"])
    op.create_index("idx_order_events_created_at", "order_events", [sa.text("created_at desc")])


def downgrade() -> None:
    op.drop_index("idx_order_events_created_at", table_name="order_events")
    op.drop_index("idx_order_events_order_id", table_name="order_events")
    op.drop_table("order_events")
    op.drop_index("idx_refunds_order_id", table_name="refunds")
    op.drop_index("idx_refunds_payment_id", table_name="refunds")
    op.drop_table("refunds")
    op.drop_index("idx_payments_status", table_name="payments")
    op.drop_index("idx_payments_order_id", table_name="payments")
    op.drop_table("payments")
    op.drop_index("idx_orders_status", table_name="orders")
    op.drop_index("idx_orders_seller_user_id", table_name="orders")
    op.drop_index("idx_orders_buyer_user_id", table_name="orders")
    op.drop_table("orders")
    op.drop_index("idx_offers_provider_user_id", table_name="offers")
    op.drop_index("idx_offers_demand_id", table_name="offers")
    op.drop_table("offers")
    op.drop_index("idx_demands_created_at", table_name="demands")
    op.drop_index("idx_demands_status", table_name="demands")
    op.drop_index("idx_demands_service_type", table_name="demands")
    op.drop_index("idx_demands_user_id", table_name="demands")
    op.drop_table("demands")
    op.drop_index("idx_pets_user_id", table_name="pets")
    op.drop_table("pets")
    op.drop_table("provider_profiles")
    op.drop_table("users")
