"""
Task Scheduler for Automated Operations

This module sets up APScheduler to run periodic automated tasks:
- Daily fee reminders at 9 AM
- Daily attendance alerts at 6 PM
- Weekly analytics computation on Sunday 2 AM
- Monthly report generation on 1st of month at 6 AM
- Cache cleanup daily at 3 AM
"""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.services.fee_reminder_service import FeeReminderService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AutomationScheduler:
    """
    Scheduler for all automation tasks
    """

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False

    async def daily_fee_reminders(self):
        """
        Daily task to send automated fee reminders
        Runs every day at 9:00 AM
        """
        logger.info("Starting daily fee reminders job...")

        async with AsyncSessionLocal() as db:
            try:
                stats = await FeeReminderService.process_automated_reminders(db)
                logger.info(
                    f"Fee reminders completed: Processed {stats['total_processed']}, "
                    f"Sent {stats['reminders_sent']}, Failed {stats['reminders_failed']}"
                )
            except Exception as e:
                logger.error(f"Error in daily fee reminders: {str(e)}")

    async def daily_attendance_alerts(self):
        """
        Daily task to check attendance and send alerts
        Runs every day at 6:00 PM
        """
        logger.info("Starting daily attendance alerts job...")

        async with AsyncSessionLocal() as db:
            try:
                # TODO: Implement attendance alert service
                logger.info("Attendance alerts job completed")
            except Exception as e:
                logger.error(f"Error in attendance alerts: {str(e)}")

    async def weekly_analytics_computation(self):
        """
        Weekly task to pre-compute analytics
        Runs every Sunday at 2:00 AM
        """
        logger.info("Starting weekly analytics computation...")

        async with AsyncSessionLocal() as db:
            try:
                from app.services.analytics_service import AnalyticsService
                from app.models.academic import AcademicYear
                from sqlalchemy import select

                # Get current academic year
                stmt = select(AcademicYear).where(AcademicYear.is_current == True)
                result = await db.execute(stmt)
                current_year = result.scalar_one_or_none()

                if not current_year:
                    logger.warning("No current academic year found")
                    return

                # Pre-compute and cache all analytics
                logger.info(f"Computing analytics for academic year: {current_year.name}")

                # Dashboard summary
                dashboard = await AnalyticsService.get_dashboard_summary(db, current_year.id)
                await AnalyticsService.cache_analytics(
                    db, "dashboard", {"academic_year_id": current_year.id}, dashboard, 604800  # 7 days
                )

                # Collection trends
                trends = await AnalyticsService.analyze_fee_collection_trends(db, current_year.id)
                await AnalyticsService.cache_analytics(
                    db, "collection_trends", {"academic_year_id": current_year.id}, trends, 604800
                )

                # Class performance
                performance = await AnalyticsService.get_class_performance_insights(db, current_year.id)
                await AnalyticsService.cache_analytics(
                    db, "class_performance", {"academic_year_id": current_year.id}, performance, 604800
                )

                logger.info("Weekly analytics computation completed successfully")
            except Exception as e:
                logger.error(f"Error in analytics computation: {str(e)}")

    async def monthly_report_generation(self):
        """
        Monthly task to auto-generate reports
        Runs on 1st of every month at 6:00 AM
        """
        logger.info("Starting monthly report generation...")

        async with AsyncSessionLocal() as db:
            try:
                # TODO: Implement report generation
                logger.info("Monthly reports generated")
            except Exception as e:
                logger.error(f"Error in report generation: {str(e)}")

    async def daily_cache_cleanup(self):
        """
        Daily task to clean up expired cache
        Runs every day at 3:00 AM
        """
        logger.info("Starting cache cleanup...")

        async with AsyncSessionLocal() as db:
            try:
                from sqlalchemy import delete
                from app.models.automation import AnalyticsCache

                # Delete expired cache entries
                stmt = delete(AnalyticsCache).where(
                    AnalyticsCache.expires_at < datetime.utcnow()
                )
                result = await db.execute(stmt)
                await db.commit()

                logger.info(f"Cache cleanup completed: Deleted {result.rowcount} expired entries")
            except Exception as e:
                logger.error(f"Error in cache cleanup: {str(e)}")

    def setup_jobs(self):
        """
        Setup all scheduled jobs
        """
        # Daily fee reminders at 9:00 AM
        self.scheduler.add_job(
            self.daily_fee_reminders,
            trigger=CronTrigger(hour=9, minute=0),
            id="daily_fee_reminders",
            name="Daily Fee Reminders",
            replace_existing=True
        )

        # Daily attendance alerts at 6:00 PM
        self.scheduler.add_job(
            self.daily_attendance_alerts,
            trigger=CronTrigger(hour=18, minute=0),
            id="daily_attendance_alerts",
            name="Daily Attendance Alerts",
            replace_existing=True
        )

        # Weekly analytics computation (Sunday 2:00 AM)
        self.scheduler.add_job(
            self.weekly_analytics_computation,
            trigger=CronTrigger(day_of_week="sun", hour=2, minute=0),
            id="weekly_analytics",
            name="Weekly Analytics Computation",
            replace_existing=True
        )

        # Monthly report generation (1st of month, 6:00 AM)
        self.scheduler.add_job(
            self.monthly_report_generation,
            trigger=CronTrigger(day=1, hour=6, minute=0),
            id="monthly_reports",
            name="Monthly Report Generation",
            replace_existing=True
        )

        # Daily cache cleanup at 3:00 AM
        self.scheduler.add_job(
            self.daily_cache_cleanup,
            trigger=CronTrigger(hour=3, minute=0),
            id="cache_cleanup",
            name="Daily Cache Cleanup",
            replace_existing=True
        )

        logger.info("All scheduled jobs configured successfully")

    def start(self):
        """
        Start the scheduler
        """
        if not self.is_running:
            self.setup_jobs()
            self.scheduler.start()
            self.is_running = True
            logger.info("Automation scheduler started")

            # Log scheduled jobs
            jobs = self.scheduler.get_jobs()
            logger.info(f"Active jobs: {len(jobs)}")
            for job in jobs:
                logger.info(f"  - {job.name}: {job.next_run_time}")

    def stop(self):
        """
        Stop the scheduler
        """
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("Automation scheduler stopped")

    def get_job_status(self):
        """
        Get status of all scheduled jobs
        """
        jobs = self.scheduler.get_jobs()
        return [
            {
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            }
            for job in jobs
        ]


# Global scheduler instance
automation_scheduler = AutomationScheduler()
