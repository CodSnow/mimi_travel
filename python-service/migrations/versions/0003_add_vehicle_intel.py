"""add vehicle and intelligence tables

Revision ID: 0003_add_vehicle_intel
Revises: 0002_add_comm_reviews
Create Date: 2026-04-29
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0003_add_vehicle_intel"
down_revision: str | None = "0002_add_comm_reviews"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "vehicle_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("vehicle_type", sa.String(length=32), nullable=False),
        sa.Column("plate_masked", sa.String(length=32), nullable=False),
        sa.Column("seats", sa.Integer(), nullable=False),
        sa.Column("trunk_level", sa.String(length=16), nullable=True),
        sa.Column("supports_cat_bag", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("supports_crate", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("supports_stroller", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("supports_multi_pet", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("pet_friendly", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("pet_friendly_tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_vehicle_profiles_user_id", "vehicle_profiles", ["user_id"])
    op.create_foreign_key(
        "fk_offers_vehicle_id_vehicle_profiles",
        "offers",
        "vehicle_profiles",
        ["vehicle_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_orders_vehicle_id_vehicle_profiles",
        "orders",
        "vehicle_profiles",
        ["vehicle_id"],
        ["id"],
    )

    op.create_table(
        "location_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("lat", sa.Numeric(10, 7), nullable=False),
        sa.Column("lng", sa.Numeric(10, 7), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("coord_system", sa.String(length=16), nullable=False, server_default="gcj02"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_location_snapshots_order_id", "location_snapshots", ["order_id"])
    op.create_index("idx_location_snapshots_user_id", "location_snapshots", ["user_id"])

    op.create_table(
        "recommendation_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("demand_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("demands.id"), nullable=False),
        sa.Column("recommendation_type", sa.String(length=32), nullable=False),
        sa.Column("candidate_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("score", sa.Numeric(8, 4), nullable=False),
        sa.Column("reason_codes", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_recommendation_snapshots_demand_id", "recommendation_snapshots", ["demand_id"])

    op.create_table(
        "risk_decisions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=True),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("payments.id"), nullable=True),
        sa.Column("decision_type", sa.String(length=32), nullable=False),
        sa.Column("allowed", sa.Boolean(), nullable=False),
        sa.Column("risk_level", sa.String(length=16), nullable=False),
        sa.Column("reason_codes", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("detail", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_risk_decisions_order_id", "risk_decisions", ["order_id"])
    op.create_index("idx_risk_decisions_payment_id", "risk_decisions", ["payment_id"])


def downgrade() -> None:
    op.drop_index("idx_risk_decisions_payment_id", table_name="risk_decisions")
    op.drop_index("idx_risk_decisions_order_id", table_name="risk_decisions")
    op.drop_table("risk_decisions")
    op.drop_index("idx_recommendation_snapshots_demand_id", table_name="recommendation_snapshots")
    op.drop_table("recommendation_snapshots")
    op.drop_index("idx_location_snapshots_user_id", table_name="location_snapshots")
    op.drop_index("idx_location_snapshots_order_id", table_name="location_snapshots")
    op.drop_table("location_snapshots")
    op.drop_constraint("fk_orders_vehicle_id_vehicle_profiles", "orders", type_="foreignkey")
    op.drop_constraint("fk_offers_vehicle_id_vehicle_profiles", "offers", type_="foreignkey")
    op.drop_index("idx_vehicle_profiles_user_id", table_name="vehicle_profiles")
    op.drop_table("vehicle_profiles")
