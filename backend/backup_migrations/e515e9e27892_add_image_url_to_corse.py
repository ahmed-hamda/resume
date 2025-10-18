"""Add image_url to Course (idempotent)"""

from alembic import op
import sqlalchemy as sa

revision = 'e515e9e27892'
down_revision = 'e56cecbd5559'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c['name'] for c in insp.get_columns('course')}

    # N'ajouter que si la colonne n'existe pas
    if 'image_url' not in existing_cols:
        with op.batch_alter_table('course', schema=None) as batch_op:
            batch_op.add_column(sa.Column('image_url', sa.String(length=500), nullable=True))
    # sinon, ne rien faire (la colonne est déjà là)

def downgrade():
    # On ne supprime que si elle existe
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c['name'] for c in insp.get_columns('course')}

    if 'image_url' in existing_cols:
        with op.batch_alter_table('course', schema=None) as batch_op:
            batch_op.drop_column('image_url')
