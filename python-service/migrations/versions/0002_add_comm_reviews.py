"""add communication and reviews

Revision ID: 0002_add_comm_reviews
Revises: 0001_init_core_tables
Create Date: 2026-04-29
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002_add_comm_reviews"
down_revision: str | None = "0001_init_core_tables"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("demand_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("demands.id"), nullable=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=True),
        sa.Column("participant_user_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conversations.id"), nullable=False),
        sa.Column("sender_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("related_demand_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("demands.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_messages_conversation_id", "messages", ["conversation_id"])
    op.create_index("idx_messages_created_at", "messages", [sa.text("created_at desc")])

    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("reviewer_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reviewee_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("overall_score", sa.Numeric(4, 2), nullable=False),
        sa.Column("cat_care_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("pet_friendly_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("driving_stability_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("punctuality_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("cleanliness_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("communication_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("feedback_completeness_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("medication_accuracy_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("supports_pet_handling_score", sa.Numeric(4, 2), nullable=True),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_reviews_reviewee_user_id", "reviews", ["reviewee_user_id"])
    op.create_index("idx_reviews_order_id", "reviews", ["order_id"])

    op.create_table(
        "service_feedbacks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("provider_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("arrived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("left_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("photo_urls", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("video_urls", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_service_feedbacks_order_id", "service_feedbacks", ["order_id"])


def downgrade() -> None:
    op.drop_index("idx_service_feedbacks_order_id", table_name="service_feedbacks")
    op.drop_table("service_feedbacks")
    op.drop_index("idx_reviews_order_id", table_name="reviews")
    op.drop_index("idx_reviews_reviewee_user_id", table_name="reviews")
    op.drop_table("reviews")
    op.drop_index("idx_messages_created_at", table_name="messages")
    op.drop_index("idx_messages_conversation_id", table_name="messages")
    op.drop_table("messages")
    op.drop_table("conversations")
