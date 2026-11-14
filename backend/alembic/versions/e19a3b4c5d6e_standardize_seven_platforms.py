"""standardize_seven_platforms

Revision ID: e19a3b4c5d6e
Revises: ce6563a5fbc7
Create Date: 2026-10-30 02:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e19a3b4c5d6e'
down_revision: Union[str, None] = 'ce6563a5fbc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add is_active column to client_social_accounts to safely preserve historical non-standard accounts
    op.add_column(
        'client_social_accounts',
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true())
    )
    op.create_index(
        op.f('ix_client_social_accounts_is_active'),
        'client_social_accounts',
        ['is_active'],
        unique=False
    )

    # 2. Standardize active supported platforms to canonical lowercase identifiers
    op.execute("UPDATE client_social_accounts SET platform = 'linkedin' WHERE LOWER(platform) = 'linkedin'")
    op.execute("UPDATE client_social_accounts SET platform = 'x' WHERE LOWER(platform) IN ('twitter', 'twitter/x', 'x')")
    op.execute("UPDATE client_social_accounts SET platform = 'instagram' WHERE LOWER(platform) = 'instagram'")
    op.execute("UPDATE client_social_accounts SET platform = 'youtube' WHERE LOWER(platform) = 'youtube'")
    op.execute("UPDATE client_social_accounts SET platform = 'pinterest' WHERE LOWER(platform) = 'pinterest'")
    op.execute("UPDATE client_social_accounts SET platform = 'facebook' WHERE LOWER(platform) = 'facebook'")
    op.execute("UPDATE client_social_accounts SET platform = 'whatsapp_business' WHERE LOWER(platform) IN ('whatsapp', 'whatsapp business', 'whatsapp_business')")

    # 3. Mark unsupported legacy accounts (e.g. TikTok) as is_active = false while preserving row integrity
    op.execute("UPDATE client_social_accounts SET platform = 'tiktok', is_active = false WHERE LOWER(platform) = 'tiktok'")

    # 4. Standardize content_items platform values to canonical identifiers
    op.execute("UPDATE content_items SET platform = 'instagram' WHERE LOWER(platform) = 'instagram'")
    op.execute("UPDATE content_items SET platform = 'linkedin' WHERE LOWER(platform) = 'linkedin'")
    op.execute("UPDATE content_items SET platform = 'facebook' WHERE LOWER(platform) = 'facebook'")
    op.execute("UPDATE content_items SET platform = 'youtube' WHERE LOWER(platform) = 'youtube'")
    op.execute("UPDATE content_items SET platform = 'x' WHERE LOWER(platform) IN ('twitter', 'twitter/x', 'x')")
    op.execute("UPDATE content_items SET platform = 'pinterest' WHERE LOWER(platform) = 'pinterest'")
    op.execute("UPDATE content_items SET platform = 'whatsapp_business' WHERE LOWER(platform) IN ('whatsapp', 'whatsapp business', 'whatsapp_business')")


def downgrade() -> None:
    # 1. Revert canonical platform strings to legacy capitalization
    op.execute("UPDATE client_social_accounts SET platform = 'LinkedIn' WHERE platform = 'linkedin'")
    op.execute("UPDATE client_social_accounts SET platform = 'Twitter/X' WHERE platform = 'x'")
    op.execute("UPDATE client_social_accounts SET platform = 'Instagram' WHERE platform = 'instagram'")
    op.execute("UPDATE client_social_accounts SET platform = 'YouTube' WHERE platform = 'youtube'")
    op.execute("UPDATE client_social_accounts SET platform = 'Pinterest' WHERE platform = 'pinterest'")
    op.execute("UPDATE client_social_accounts SET platform = 'Facebook' WHERE platform = 'facebook'")
    op.execute("UPDATE client_social_accounts SET platform = 'WhatsApp Business' WHERE platform = 'whatsapp_business'")
    op.execute("UPDATE client_social_accounts SET platform = 'TikTok' WHERE platform = 'tiktok'")

    op.execute("UPDATE content_items SET platform = 'Instagram' WHERE platform = 'instagram'")
    op.execute("UPDATE content_items SET platform = 'LinkedIn' WHERE platform = 'linkedin'")
    op.execute("UPDATE content_items SET platform = 'Facebook' WHERE platform = 'facebook'")
    op.execute("UPDATE content_items SET platform = 'YouTube' WHERE platform = 'youtube'")
    op.execute("UPDATE content_items SET platform = 'Twitter/X' WHERE platform = 'x'")
    op.execute("UPDATE content_items SET platform = 'Pinterest' WHERE platform = 'pinterest'")
    op.execute("UPDATE content_items SET platform = 'WhatsApp Business' WHERE platform = 'whatsapp_business'")

    # 2. Drop is_active column and index
    op.drop_index(op.f('ix_client_social_accounts_is_active'), table_name='client_social_accounts')
    op.drop_column('client_social_accounts', 'is_active')

