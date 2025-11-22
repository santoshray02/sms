"""Add automation tables for AI-powered features

Revision ID: 004_automation_tables
Revises: 003_smart_batch_management
Create Date: 2025-11-22 12:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_automation_tables'
down_revision = '003_smart_batch_management'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Fee Reminders Tracking
    op.create_table(
        'fee_reminders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('monthly_fee_id', sa.Integer(), nullable=False),
        sa.Column('reminder_type', sa.String(20), nullable=False,
                  comment='advance, due, overdue, final'),
        sa.Column('amount_pending', sa.Integer(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), nullable=False),
        sa.Column('sms_status', sa.String(20), nullable=True),
        sa.Column('sms_id', sa.String(100), nullable=True),
        sa.Column('payment_received_after', sa.Boolean(), default=False),
        sa.Column('days_to_payment', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['monthly_fee_id'], ['monthly_fees.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_fee_reminders_student', 'fee_reminders', ['student_id'])
    op.create_index('idx_fee_reminders_sent_at', 'fee_reminders', ['sent_at'])
    op.create_index('idx_fee_reminders_due_date', 'fee_reminders', ['due_date'])

    # Attendance Alerts
    op.create_table(
        'attendance_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('alert_type', sa.String(20), nullable=False,
                  comment='warning, urgent, critical'),
        sa.Column('attendance_percentage', sa.Numeric(5, 2), nullable=False),
        sa.Column('threshold_crossed', sa.Numeric(5, 2), nullable=False),
        sa.Column('sent_to', sa.String(20), nullable=False,
                  comment='parent, teacher, principal'),
        sa.Column('sent_at', sa.DateTime(), nullable=False),
        sa.Column('resolved', sa.Boolean(), default=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_attendance_alerts_student', 'attendance_alerts', ['student_id'])
    op.create_index('idx_attendance_alerts_resolved', 'attendance_alerts', ['resolved'])

    # Generated Documents
    op.create_table(
        'generated_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=True),
        sa.Column('document_type', sa.String(50), nullable=False,
                  comment='tc, bonafide, receipt, character, progress_report'),
        sa.Column('document_path', sa.String(500), nullable=False),
        sa.Column('verification_code', sa.String(100), nullable=False, unique=True),
        sa.Column('generated_by', sa.Integer(), nullable=False),
        sa.Column('generated_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.Column('accessed_count', sa.Integer(), default=0),
        sa.Column('last_accessed', sa.DateTime(), nullable=True),
        sa.Column('document_metadata', postgresql.JSONB(), nullable=True,
                  comment='Additional document-specific data'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['generated_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_documents_student', 'generated_documents', ['student_id'])
    op.create_index('idx_documents_verification', 'generated_documents', ['verification_code'])
    op.create_index('idx_documents_type', 'generated_documents', ['document_type'])

    # Analytics Cache
    op.create_table(
        'analytics_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('report_type', sa.String(50), nullable=False),
        sa.Column('parameters', postgresql.JSONB(), nullable=True),
        sa.Column('result_data', postgresql.JSONB(), nullable=False),
        sa.Column('computed_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_analytics_report_type', 'analytics_cache', ['report_type'])
    op.create_index('idx_analytics_expires', 'analytics_cache', ['expires_at'])
    # Unique constraint on report_type + parameters
    op.create_index('idx_analytics_unique', 'analytics_cache',
                    ['report_type', sa.text('(parameters::text)')], unique=True)

    # Reconciliation Log
    op.create_table(
        'reconciliation_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('bank_transaction_id', sa.String(100), nullable=False),
        sa.Column('payment_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('match_confidence', sa.Numeric(5, 2), nullable=True,
                  comment='0-100% confidence score'),
        sa.Column('matched_by', sa.String(20), nullable=False,
                  comment='auto, manual'),
        sa.Column('matched_by_user', sa.Integer(), nullable=True),
        sa.Column('matched_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('bank_data', postgresql.JSONB(), nullable=True,
                  comment='Original bank statement data'),
        sa.ForeignKeyConstraint(['payment_id'], ['payments.id']),
        sa.ForeignKeyConstraint(['matched_by_user'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_reconciliation_payment', 'reconciliation_log', ['payment_id'])
    op.create_index('idx_reconciliation_bank_txn', 'reconciliation_log', ['bank_transaction_id'])

    # System Configuration for Automation
    op.create_table(
        'automation_config',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('config_key', sa.String(100), nullable=False, unique=True),
        sa.Column('config_value', sa.String(500), nullable=False),
        sa.Column('config_type', sa.String(20), nullable=False,
                  comment='string, integer, boolean, json'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Insert default automation configuration
    op.execute("""
        INSERT INTO automation_config (config_key, config_value, config_type, description) VALUES
        ('fee_reminder_enabled', 'true', 'boolean', 'Enable automated fee reminders'),
        ('fee_reminder_days_before', '3', 'integer', 'Days before due date to send reminder'),
        ('fee_reminder_overdue_days', '3,7,15', 'string', 'Days after due date for reminders'),
        ('max_reminders_per_student', '4', 'integer', 'Maximum reminders per fee'),
        ('attendance_warning_threshold', '80', 'integer', 'Attendance % for warning'),
        ('attendance_urgent_threshold', '75', 'integer', 'Attendance % for urgent alert'),
        ('attendance_critical_threshold', '70', 'integer', 'Attendance % for critical alert'),
        ('analytics_cache_ttl', '86400', 'integer', 'Analytics cache TTL in seconds'),
        ('enable_predictive_analytics', 'true', 'boolean', 'Enable ML-based predictions'),
        ('document_qr_enabled', 'true', 'boolean', 'Enable QR verification for documents')
    """)


def downgrade() -> None:
    op.drop_table('automation_config')
    op.drop_table('reconciliation_log')
    op.drop_table('analytics_cache')
    op.drop_table('generated_documents')
    op.drop_table('attendance_alerts')
    op.drop_table('fee_reminders')
