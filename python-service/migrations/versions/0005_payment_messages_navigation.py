"""add payment messages navigation support

Revision ID: 0005_payment_messages_navigation
Revises: 0004_foundation_profiles
Create Date: 2026-05-13
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0005_payment_messages_navigation"
down_revision: str | None = "0004_foundation_profiles"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("payments", sa.Column("idempotency_key", sa.String(length=128), nullable=True))
    op.add_column("payments", sa.Column("query_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("payments", sa.Column("event_summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("payments", sa.Column("channel_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.create_unique_constraint("uq_payments_idempotency_key", "payments", ["idempotency_key"])
    op.create_index("idx_payments_idempotency_key", "payments", ["idempotency_key"])

    op.create_table(
        "payment_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("payments.id"), nullable=True),
        sa.Column("refund_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("refunds.id"), nullable=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_payment_events_payment_id", "payment_events", ["payment_id"])
    op.create_index("idx_payment_events_order_id", "payment_events", ["order_id"])
    op.create_index("idx_payment_events_created_at", "payment_events", [sa.text("created_at desc")])

    op.add_column("messages", sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("messages", sa.Column("client_msg_id", sa.String(length=128), nullable=True))
    op.add_column("messages", sa.Column("related_order_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key("fk_messages_related_order_id_orders", "messages", "orders", ["related_order_id"], ["id"])

    op.create_table(
        "message_reads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conversations.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("last_read_message_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("messages.id"), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("conversation_id", "user_id", name="uq_message_reads_conversation_user"),
    )
    op.create_index("idx_message_reads_conversation_id", "message_reads", ["conversation_id"])


def downgrade() -> None:
    op.drop_index("idx_message_reads_conversation_id", table_name="message_reads")
    op.drop_table("message_reads")

    op.drop_constraint("fk_messages_related_order_id_orders", "messages", type_="foreignkey")
    op.drop_column("messages", "related_order_id")
    op.drop_column("messages", "client_msg_id")
    op.drop_column("messages", "payload")

    op.drop_index("idx_payment_events_created_at", table_name="payment_events")
    op.drop_index("idx_payment_events_order_id", table_name="payment_events")
    op.drop_index("idx_payment_events_payment_id", table_name="payment_events")
    op.drop_table("payment_events")

    op.drop_index("idx_payments_idempotency_key", table_name="payments")
    op.drop_constraint("uq_payments_idempotency_key", "payments", type_="unique")
    op.drop_column("payments", "channel_payload")
    op.drop_column("payments", "event_summary")
    op.drop_column("payments", "query_count")
    op.drop_column("payments", "idempotency_key")
