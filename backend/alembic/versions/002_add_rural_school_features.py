"""Add rural school features: guardians, extended classes, caste/category

Revision ID: 002_rural_features
Revises:
Create Date: 2025-11-20

Changes:
- Create guardians table (one guardian -> multiple students)
- Add caste/category fields to students
- Add scholarship/concession fields
- Update classes to Pre-Nursery through Class 12
- Add streams for Class 11-12 (Science/Commerce/Arts)
"""
from alembic import op
import sqlalchemy as sa
from datetime import date


# revision identifiers
revision = '002_rural_features'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create guardians table
    op.create_table(
        'guardians',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('full_name', sa.String(200), nullable=False),
        sa.Column('relation', sa.String(50), nullable=False),  # Father/Mother/Guardian
        sa.Column('phone', sa.String(15), nullable=False, unique=True),
        sa.Column('alternate_phone', sa.String(15), nullable=True),
        sa.Column('email', sa.String(100), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('occupation', sa.String(100), nullable=True),
        sa.Column('annual_income', sa.Integer(), nullable=True),  # in rupees
        sa.Column('education', sa.String(100), nullable=True),
        sa.Column('aadhaar_number', sa.String(12), nullable=True, unique=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_guardians_phone', 'guardians', ['phone'])
    op.create_index('idx_guardians_aadhaar', 'guardians', ['aadhaar_number'])

    # Add guardian_id to students table
    op.add_column('students', sa.Column('guardian_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_students_guardian', 'students', 'guardians', ['guardian_id'], ['id'])
    op.create_index('idx_students_guardian', 'students', ['guardian_id'])

    # Add caste/category fields to students
    op.add_column('students', sa.Column('category', sa.String(20), nullable=True))  # General/SC/ST/OBC/EWS
    op.add_column('students', sa.Column('caste', sa.String(100), nullable=True))
    op.add_column('students', sa.Column('religion', sa.String(50), nullable=True))
    op.add_column('students', sa.Column('caste_certificate_number', sa.String(50), nullable=True))
    op.add_column('students', sa.Column('income_certificate_number', sa.String(50), nullable=True))
    op.add_column('students', sa.Column('bpl_card_number', sa.String(50), nullable=True))
    op.add_column('students', sa.Column('aadhaar_number', sa.String(12), nullable=True, unique=True))
    op.add_column('students', sa.Column('blood_group', sa.String(5), nullable=True))
    op.add_column('students', sa.Column('photo_url', sa.String(255), nullable=True))

    # Add scholarship fields
    op.add_column('students', sa.Column('scholarship_type', sa.String(100), nullable=True))
    op.add_column('students', sa.Column('scholarship_amount', sa.Integer(), default=0))  # monthly amount in paise
    op.add_column('students', sa.Column('concession_percentage', sa.Integer(), default=0))  # 0-100
    op.add_column('students', sa.Column('concession_reason', sa.String(200), nullable=True))

    # Add board exam fields
    op.add_column('students', sa.Column('board_registration_number', sa.String(50), nullable=True))
    op.add_column('students', sa.Column('roll_number', sa.String(20), nullable=True))

    # Create indexes
    op.create_index('idx_students_category', 'students', ['category'])
    op.create_index('idx_students_aadhaar', 'students', ['aadhaar_number'])

    # Create streams table for Class 11-12
    op.create_table(
        'streams',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False),  # Science/Commerce/Arts
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('display_order', sa.Integer(), default=0),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Add stream_id to classes
    op.add_column('classes', sa.Column('stream_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_classes_stream', 'classes', 'streams', ['stream_id'], ['id'])

    # Rename 'name' to 'standard' in classes for clarity
    op.add_column('classes', sa.Column('standard', sa.String(50), nullable=True))

    # Insert extended classes data
    # This will be done via data migration script

    # Create concessions table
    op.create_table(
        'concessions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('concession_type', sa.String(100), nullable=False),  # Scholarship/Sibling/Merit/Financial
        sa.Column('percentage', sa.Integer(), nullable=False),  # 0-100
        sa.Column('amount', sa.Integer(), nullable=False),  # fixed amount in paise
        sa.Column('reason', sa.String(200), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('valid_from', sa.Date(), nullable=False),
        sa.Column('valid_to', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_foreign_key('fk_concessions_student', 'concessions', 'students', ['student_id'], ['id'])
    op.create_foreign_key('fk_concessions_user', 'concessions', 'users', ['approved_by'], ['id'])
    op.create_index('idx_concessions_student', 'concessions', ['student_id'])

    # Create attendance table
    op.create_table(
        'attendance',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),  # Present/Absent/Late/HalfDay
        sa.Column('remarks', sa.String(200), nullable=True),
        sa.Column('marked_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_foreign_key('fk_attendance_student', 'attendance', 'students', ['student_id'], ['id'])
    op.create_foreign_key('fk_attendance_class', 'attendance', 'classes', ['class_id'], ['id'])
    op.create_foreign_key('fk_attendance_user', 'attendance', 'users', ['marked_by'], ['id'])
    op.create_index('idx_attendance_student_date', 'attendance', ['student_id', 'date'], unique=True)
    op.create_index('idx_attendance_date', 'attendance', ['date'])

    # Add SMS tracking columns
    op.add_column('system_settings', sa.Column('sms_provider', sa.String(50), nullable=True))
    op.add_column('system_settings', sa.Column('sms_api_key', sa.String(255), nullable=True))
    op.add_column('system_settings', sa.Column('sms_sender_id', sa.String(10), nullable=True))
    op.add_column('system_settings', sa.Column('sms_balance', sa.Integer(), default=0))
    op.add_column('system_settings', sa.Column('sms_enabled', sa.Boolean(), default=False))

    # Add school details to system_settings
    op.add_column('system_settings', sa.Column('school_name', sa.String(200), nullable=True))
    op.add_column('system_settings', sa.Column('school_code', sa.String(50), nullable=True))  # UDISE code
    op.add_column('system_settings', sa.Column('affiliation_number', sa.String(50), nullable=True))  # CBSE
    op.add_column('system_settings', sa.Column('school_address', sa.Text(), nullable=True))
    op.add_column('system_settings', sa.Column('principal_name', sa.String(100), nullable=True))
    op.add_column('system_settings', sa.Column('principal_signature_url', sa.String(255), nullable=True))
    op.add_column('system_settings', sa.Column('school_logo_url', sa.String(255), nullable=True))


def downgrade():
    # Drop new tables
    op.drop_table('attendance')
    op.drop_table('concessions')
    op.drop_table('streams')
    op.drop_table('guardians')

    # Remove columns from students
    op.drop_column('students', 'guardian_id')
    op.drop_column('students', 'category')
    op.drop_column('students', 'caste')
    op.drop_column('students', 'religion')
    op.drop_column('students', 'caste_certificate_number')
    op.drop_column('students', 'income_certificate_number')
    op.drop_column('students', 'bpl_card_number')
    op.drop_column('students', 'aadhaar_number')
    op.drop_column('students', 'blood_group')
    op.drop_column('students', 'photo_url')
    op.drop_column('students', 'scholarship_type')
    op.drop_column('students', 'scholarship_amount')
    op.drop_column('students', 'concession_percentage')
    op.drop_column('students', 'concession_reason')
    op.drop_column('students', 'board_registration_number')
    op.drop_column('students', 'roll_number')

    # Remove columns from classes
    op.drop_column('classes', 'stream_id')
    op.drop_column('classes', 'standard')

    # Remove columns from system_settings
    op.drop_column('system_settings', 'sms_provider')
    op.drop_column('system_settings', 'sms_api_key')
    op.drop_column('system_settings', 'sms_sender_id')
    op.drop_column('system_settings', 'sms_balance')
    op.drop_column('system_settings', 'sms_enabled')
    op.drop_column('system_settings', 'school_name')
    op.drop_column('system_settings', 'school_code')
    op.drop_column('system_settings', 'affiliation_number')
    op.drop_column('system_settings', 'school_address')
    op.drop_column('system_settings', 'principal_name')
    op.drop_column('system_settings', 'principal_signature_url')
    op.drop_column('system_settings', 'school_logo_url')
