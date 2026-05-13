"""add foundation profile tables

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
        sa.Column(
            "credential_urls",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
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

    op.add_column(
        "demands",
        sa.Column(
            "pet_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column("demands", sa.Column("pet_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("orders", sa.Column("pet_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("orders", sa.Column("payment_status", sa.String(length=32), nullable=False, server_default="unpaid"))
    op.add_column("orders", sa.Column("refund_status", sa.String(length=32), nullable=False, server_default="none"))
    op.add_column("orders", sa.Column("feedback_summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column(
        "provider_profiles",
        sa.Column("accepting_orders", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "provider_profiles",
        sa.Column(
            "service_time_slots",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )


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
