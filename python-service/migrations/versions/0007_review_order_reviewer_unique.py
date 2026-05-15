"""add review order reviewer uniqueness

Revision ID: 0007_review_order_reviewer_unique
Revises: 0006_governance_policy
Create Date: 2026-05-14
"""

from alembic import op


revision: str = "0007_review_order_reviewer_unique"
down_revision: str | None = "0006_governance_policy"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.execute(
        """
        DELETE FROM reviews
        WHERE id IN (
            SELECT id
            FROM (
                SELECT
                    id,
                    row_number() OVER (
                        PARTITION BY order_id, reviewer_user_id
                        ORDER BY created_at ASC, id ASC
                    ) AS duplicate_rank
                FROM reviews
            ) ranked
            WHERE ranked.duplicate_rank > 1
        )
        """
    )
    op.create_unique_constraint(
        "uq_reviews_order_reviewer",
        "reviews",
        ["order_id", "reviewer_user_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_reviews_order_reviewer", "reviews", type_="unique")
