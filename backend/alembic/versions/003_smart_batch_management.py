"""Smart batch management system

Revision ID: 003_smart_batch_management
Revises: 002_rural_features
Create Date: 2025-11-20 18:20:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_smart_batch_management'
down_revision = '002_rural_features'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add batch configuration to system_settings
    op.add_column('system_settings', sa.Column('max_batch_size', sa.Integer(), nullable=True, server_default='30'))
    op.add_column('system_settings', sa.Column('batch_assignment_strategy', sa.String(20), nullable=True, server_default='alphabetical'))
    op.add_column('system_settings', sa.Column('auto_assign_sections', sa.Boolean(), nullable=True, server_default='true'))
    op.add_column('system_settings', sa.Column('reorganize_annually', sa.Boolean(), nullable=True, server_default='true'))
    op.add_column('system_settings', sa.Column('last_reorganization_date', sa.Date(), nullable=True))

    # 2. Add computed section to students table
    op.add_column('students', sa.Column('computed_section', sa.String(5), nullable=True, comment='Auto-assigned section (A, B, C...)'))

    # 3. Add performance tracking for merit-based assignment (AI-ready)
    op.add_column('students', sa.Column('average_marks', sa.Float(), nullable=True, comment='Rolling average for merit calculation'))
    op.add_column('students', sa.Column('last_performance_update', sa.DateTime(), nullable=True))
    op.add_column('students', sa.Column('attendance_percentage', sa.Float(), nullable=True))

    # 4. Add section assignment history for tracking
    op.create_table(
        'section_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('assigned_section', sa.String(5), nullable=False),
        sa.Column('assignment_strategy', sa.String(20), nullable=False),
        sa.Column('assignment_reason', sa.Text(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('assigned_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('idx_section_assignments_student', 'section_assignments', ['student_id'])
    op.create_index('idx_section_assignments_class_year', 'section_assignments', ['class_id', 'academic_year_id'])


def downgrade():
    # Drop section assignments table
    op.drop_index('idx_section_assignments_class_year')
    op.drop_index('idx_section_assignments_student')
    op.drop_table('section_assignments')

    # Remove student columns
    op.drop_column('students', 'attendance_percentage')
    op.drop_column('students', 'last_performance_update')
    op.drop_column('students', 'average_marks')
    op.drop_column('students', 'computed_section')

    # Remove system settings columns
    op.drop_column('system_settings', 'last_reorganization_date')
    op.drop_column('system_settings', 'reorganize_annually')
    op.drop_column('system_settings', 'auto_assign_sections')
    op.drop_column('system_settings', 'batch_assignment_strategy')
    op.drop_column('system_settings', 'max_batch_size')
