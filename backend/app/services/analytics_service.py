"""
Predictive Analytics Service

Provides AI-powered insights for proactive school management:
- At-risk student detection
- Revenue forecasting
- Dropout prediction
- Fee collection trends
- Class performance insights
"""
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import select, func, and_, or_, case, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from collections import defaultdict
import statistics

from app.models.student import Student
from app.models.fee import MonthlyFee
from app.models.payment import Payment
from app.models.attendance import Attendance
from app.models.automation import AnalyticsCache, FeeReminder
from app.models.academic import AcademicYear, Class


class AnalyticsService:
    """Service for predictive analytics and insights"""

    @staticmethod
    async def get_at_risk_students(
        db: AsyncSession,
        academic_year_id: int,
        threshold_attendance: float = 75.0,
        threshold_payment_delays: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Identify students at risk of dropping out

        Risk factors:
        - Low attendance (<75%)
        - Multiple payment delays
        - Declining performance (future: when marks tracking added)

        Returns list of at-risk students with risk scores
        """
        # Get all active students
        stmt = (
            select(Student)
            .where(
                and_(
                    Student.academic_year_id == academic_year_id,
                    Student.status == "active"
                )
            )
            .options(
                joinedload(Student.class_),
                joinedload(Student.monthly_fees),
                joinedload(Student.payments),
                joinedload(Student.fee_reminders)
            )
        )
        result = await db.execute(stmt)
        students = result.unique().scalars().all()

        at_risk_students = []

        for student in students:
            risk_factors = []
            risk_score = 0

            # Factor 1: Low attendance
            if student.attendance_percentage and student.attendance_percentage < threshold_attendance:
                risk_score += 30
                risk_factors.append(f"Low attendance: {student.attendance_percentage:.1f}%")

            # Factor 2: Payment delays
            overdue_fees = [
                fee for fee in student.monthly_fees
                if fee.status in ["pending", "partial"] and fee.due_date < date.today()
            ]
            if len(overdue_fees) >= threshold_payment_delays:
                risk_score += 25
                total_overdue = sum(fee.amount_pending for fee in overdue_fees)
                risk_factors.append(
                    f"{len(overdue_fees)} overdue fees (Rs. {total_overdue/100:.2f})"
                )

            # Factor 3: No recent payments (3+ months)
            recent_payments = [
                p for p in student.payments
                if (date.today() - p.payment_date).days <= 90
            ]
            if not recent_payments and overdue_fees:
                risk_score += 20
                risk_factors.append("No payments in last 3 months")

            # Factor 4: Multiple fee reminders with no response
            if hasattr(student, 'fee_reminders'):
                unresponded_reminders = [
                    r for r in student.fee_reminders
                    if not r.payment_received_after
                ]
                if len(unresponded_reminders) >= 3:
                    risk_score += 15
                    risk_factors.append(f"{len(unresponded_reminders)} unresponded reminders")

            # Factor 5: Performance decline (if average_marks is tracked)
            if student.average_marks and student.average_marks < 40:
                risk_score += 10
                risk_factors.append(f"Low performance: {student.average_marks:.1f}%")

            # Only include if there's actual risk
            if risk_score >= 25:  # Minimum threshold
                at_risk_students.append({
                    "student_id": student.id,
                    "admission_number": student.admission_number,
                    "student_name": student.full_name,
                    "class_name": student.class_.name if student.class_ else "N/A",
                    "risk_score": risk_score,
                    "risk_level": (
                        "Critical" if risk_score >= 60 else
                        "High" if risk_score >= 40 else
                        "Medium"
                    ),
                    "risk_factors": risk_factors,
                    "attendance_percentage": student.attendance_percentage,
                    "overdue_fees_count": len(overdue_fees),
                    "total_overdue_amount": sum(fee.amount_pending for fee in overdue_fees) / 100,
                    "parent_phone": student.parent_phone,
                    "last_payment_date": (
                        max([p.payment_date for p in student.payments]).isoformat()
                        if student.payments else None
                    )
                })

        # Sort by risk score (highest first)
        at_risk_students.sort(key=lambda x: x["risk_score"], reverse=True)
        return at_risk_students

    @staticmethod
    async def forecast_revenue(
        db: AsyncSession,
        academic_year_id: int,
        months_ahead: int = 3
    ) -> Dict[str, Any]:
        """
        Forecast revenue for upcoming months based on historical trends

        Uses simple moving average and trend analysis
        """
        # Get payment history for last 6 months
        six_months_ago = date.today() - timedelta(days=180)

        year_col = func.extract('year', Payment.payment_date)
        month_col = func.extract('month', Payment.payment_date)

        stmt = (
            select(
                year_col.label('year'),
                month_col.label('month'),
                func.sum(Payment.amount).label('total_amount'),
                func.count(Payment.id).label('payment_count')
            )
            .join(MonthlyFee, Payment.monthly_fee_id == MonthlyFee.id)
            .where(
                and_(
                    MonthlyFee.academic_year_id == academic_year_id,
                    Payment.payment_date >= six_months_ago
                )
            )
            .group_by(year_col, month_col)
            .order_by(year_col, month_col)
        )
        result = await db.execute(stmt)
        historical_data = result.all()

        if not historical_data:
            return {
                "forecast": [],
                "average_monthly_collection": 0,
                "trend": "insufficient_data",
                "confidence": "low"
            }

        # Calculate monthly collections
        monthly_collections = [row.total_amount / 100 for row in historical_data]
        avg_collection = statistics.mean(monthly_collections) if monthly_collections else 0

        # Calculate trend (simple linear regression approximation)
        if len(monthly_collections) >= 3:
            # Compare first half vs second half average
            mid_point = len(monthly_collections) // 2
            first_half_avg = statistics.mean(monthly_collections[:mid_point])
            second_half_avg = statistics.mean(monthly_collections[mid_point:])

            if second_half_avg > first_half_avg * 1.1:
                trend = "increasing"
                trend_factor = 1.05  # 5% growth
            elif second_half_avg < first_half_avg * 0.9:
                trend = "decreasing"
                trend_factor = 0.95  # 5% decline
            else:
                trend = "stable"
                trend_factor = 1.0
        else:
            trend = "stable"
            trend_factor = 1.0

        # Generate forecast
        forecast = []
        base_amount = monthly_collections[-1] if monthly_collections else avg_collection

        for i in range(1, months_ahead + 1):
            forecasted_amount = base_amount * (trend_factor ** i)
            forecast_month = date.today() + timedelta(days=30 * i)

            forecast.append({
                "month": forecast_month.month,
                "year": forecast_month.year,
                "forecasted_amount": round(forecasted_amount, 2),
                "confidence": "medium" if i <= 2 else "low"
            })

        # Get pending fees for better accuracy
        stmt = select(func.sum(MonthlyFee.amount_pending)).where(
            and_(
                MonthlyFee.academic_year_id == academic_year_id,
                MonthlyFee.status.in_(["pending", "partial"])
            )
        )
        result = await db.execute(stmt)
        total_pending = result.scalar() or 0

        return {
            "forecast": forecast,
            "historical_average": round(avg_collection, 2),
            "last_month_collection": round(monthly_collections[-1], 2) if monthly_collections else 0,
            "trend": trend,
            "total_pending_fees": total_pending / 100,
            "confidence": "medium" if len(monthly_collections) >= 4 else "low"
        }

    @staticmethod
    async def analyze_fee_collection_trends(
        db: AsyncSession,
        academic_year_id: int
    ) -> Dict[str, Any]:
        """
        Analyze fee collection patterns and trends

        Provides insights into:
        - Collection rate by month
        - Payment mode preferences
        - Defaulter patterns
        - Class-wise collection performance
        """
        # Monthly collection rate
        stmt = (
            select(
                MonthlyFee.month,
                MonthlyFee.year,
                func.count(MonthlyFee.id).label('total_fees'),
                func.sum(case((MonthlyFee.status == 'paid', 1), else_=0)).label('paid_fees'),
                func.sum(MonthlyFee.total_fee).label('total_amount'),
                func.sum(MonthlyFee.amount_paid).label('collected_amount')
            )
            .where(MonthlyFee.academic_year_id == academic_year_id)
            .group_by(MonthlyFee.month, MonthlyFee.year)
            .order_by(MonthlyFee.year, MonthlyFee.month)
        )
        result = await db.execute(stmt)
        monthly_data = result.all()

        monthly_trends = []
        for row in monthly_data:
            collection_rate = (row.paid_fees / row.total_fees * 100) if row.total_fees > 0 else 0
            amount_rate = (row.collected_amount / row.total_amount * 100) if row.total_amount > 0 else 0

            monthly_trends.append({
                "month": row.month,
                "year": row.year,
                "total_fees_generated": row.total_fees,
                "fees_collected": row.paid_fees,
                "collection_rate": round(collection_rate, 2),
                "total_amount": row.total_amount / 100,
                "collected_amount": row.collected_amount / 100,
                "amount_collection_rate": round(amount_rate, 2)
            })

        # Payment mode analysis
        stmt = (
            select(
                Payment.payment_mode,
                func.count(Payment.id).label('count'),
                func.sum(Payment.amount).label('amount'),
                func.avg(Payment.amount).label('avg_amount')
            )
            .join(MonthlyFee, Payment.monthly_fee_id == MonthlyFee.id)
            .where(MonthlyFee.academic_year_id == academic_year_id)
            .group_by(Payment.payment_mode)
        )
        result = await db.execute(stmt)
        payment_modes = result.all()

        total_payments = sum(row.count for row in payment_modes)
        payment_mode_analysis = [
            {
                "mode": row.payment_mode,
                "transaction_count": row.count,
                "percentage": round(row.count / total_payments * 100, 2) if total_payments > 0 else 0,
                "total_amount": row.amount / 100,
                "average_transaction": row.avg_amount / 100
            }
            for row in payment_modes
        ]

        # Class-wise collection performance
        stmt = (
            select(
                Class.name.label('class_name'),
                func.count(MonthlyFee.id).label('total_fees'),
                func.sum(case((MonthlyFee.status == 'paid', 1), else_=0)).label('paid_fees'),
                func.sum(MonthlyFee.amount_pending).label('pending_amount')
            )
            .join(Student, MonthlyFee.student_id == Student.id)
            .join(Class, Student.class_id == Class.id)
            .where(MonthlyFee.academic_year_id == academic_year_id)
            .group_by(Class.name)
            .order_by(desc('pending_amount'))
        )
        result = await db.execute(stmt)
        class_performance = result.all()

        class_analysis = [
            {
                "class_name": row.class_name,
                "total_fees": row.total_fees,
                "paid_fees": row.paid_fees,
                "collection_rate": round(row.paid_fees / row.total_fees * 100, 2) if row.total_fees > 0 else 0,
                "pending_amount": row.pending_amount / 100
            }
            for row in class_performance
        ]

        # Overall statistics
        overall_collection_rate = (
            statistics.mean([m["collection_rate"] for m in monthly_trends])
            if monthly_trends else 0
        )

        return {
            "monthly_trends": monthly_trends,
            "payment_mode_analysis": payment_mode_analysis,
            "class_analysis": class_analysis,
            "overall_collection_rate": round(overall_collection_rate, 2),
            "best_performing_class": (
                max(class_analysis, key=lambda x: x["collection_rate"])
                if class_analysis else None
            ),
            "needs_attention_class": (
                min(class_analysis, key=lambda x: x["collection_rate"])
                if class_analysis else None
            )
        }

    @staticmethod
    async def get_class_performance_insights(
        db: AsyncSession,
        academic_year_id: int
    ) -> Dict[str, Any]:
        """
        Analyze class-wise performance and identify patterns

        Insights:
        - Attendance patterns by class
        - Fee collection by class
        - Student strength trends
        - Gender distribution
        """
        stmt = (
            select(
                Class.name.label('class_name'),
                func.count(Student.id).label('total_students'),
                func.sum(case((Student.gender == 'Male', 1), else_=0)).label('male_count'),
                func.sum(case((Student.gender == 'Female', 1), else_=0)).label('female_count'),
                func.avg(Student.attendance_percentage).label('avg_attendance'),
                func.avg(Student.average_marks).label('avg_performance')
            )
            .join(Student, Class.id == Student.class_id)
            .where(
                and_(
                    Student.academic_year_id == academic_year_id,
                    Student.status == 'active'
                )
            )
            .group_by(Class.name)
        )
        result = await db.execute(stmt)
        class_data = result.all()

        insights = []
        for row in class_data:
            gender_ratio = (
                row.female_count / row.male_count
                if row.male_count > 0 else 0
            )

            # Identify issues
            issues = []
            if row.avg_attendance and row.avg_attendance < 75:
                issues.append(f"Low attendance: {row.avg_attendance:.1f}%")
            if row.avg_performance and row.avg_performance < 50:
                issues.append(f"Low performance: {row.avg_performance:.1f}%")
            if gender_ratio < 0.7:
                issues.append("Low female enrollment")

            insights.append({
                "class_name": row.class_name,
                "total_students": row.total_students,
                "male_students": row.male_count,
                "female_students": row.female_count,
                "gender_ratio": round(gender_ratio, 2),
                "average_attendance": round(row.avg_attendance, 2) if row.avg_attendance else None,
                "average_performance": round(row.avg_performance, 2) if row.avg_performance else None,
                "issues": issues,
                "status": "Good" if not issues else "Needs Attention"
            })

        # Sort by number of issues (most problematic first)
        insights.sort(key=lambda x: len(x["issues"]), reverse=True)

        return {
            "class_insights": insights,
            "total_classes": len(insights),
            "classes_needing_attention": len([c for c in insights if c["issues"]]),
            "overall_gender_ratio": round(
                sum(c["female_students"] for c in insights) /
                sum(c["male_students"] for c in insights)
                if sum(c["male_students"] for c in insights) > 0 else 0,
                2
            )
        }

    @staticmethod
    async def get_dashboard_summary(
        db: AsyncSession,
        academic_year_id: int
    ) -> Dict[str, Any]:
        """
        Get comprehensive analytics dashboard summary

        Combines all analytics into a single dashboard view
        """
        # Get at-risk students count
        at_risk = await AnalyticsService.get_at_risk_students(db, academic_year_id)

        # Get revenue forecast
        revenue_forecast = await AnalyticsService.forecast_revenue(db, academic_year_id, 3)

        # Get collection trends
        collection_trends = await AnalyticsService.analyze_fee_collection_trends(db, academic_year_id)

        # Get class insights
        class_insights = await AnalyticsService.get_class_performance_insights(db, academic_year_id)

        # Current month statistics
        today = date.today()
        stmt = (
            select(
                func.count(Student.id).label('total_students'),
                func.sum(case((Student.status == 'active', 1), else_=0)).label('active_students')
            )
            .where(Student.academic_year_id == academic_year_id)
        )
        result = await db.execute(stmt)
        student_stats = result.one()

        # Recent payments (last 7 days)
        seven_days_ago = date.today() - timedelta(days=7)
        stmt = (
            select(
                func.count(Payment.id).label('payment_count'),
                func.sum(Payment.amount).label('total_amount')
            )
            .join(MonthlyFee, Payment.monthly_fee_id == MonthlyFee.id)
            .where(
                and_(
                    MonthlyFee.academic_year_id == academic_year_id,
                    Payment.payment_date >= seven_days_ago
                )
            )
        )
        result = await db.execute(stmt)
        recent_payments = result.one()

        return {
            "summary": {
                "total_students": student_stats.total_students,
                "active_students": student_stats.active_students,
                "at_risk_students": len(at_risk),
                "critical_risk_students": len([s for s in at_risk if s["risk_level"] == "Critical"]),
                "recent_payments_7_days": recent_payments.payment_count,
                "recent_collection_7_days": (recent_payments.total_amount or 0) / 100
            },
            "at_risk_students": at_risk[:10],  # Top 10 most at risk
            "revenue_forecast": revenue_forecast,
            "collection_trends": {
                "overall_rate": collection_trends["overall_collection_rate"],
                "payment_modes": collection_trends["payment_mode_analysis"],
                "best_class": collection_trends.get("best_performing_class"),
                "needs_attention_class": collection_trends.get("needs_attention_class")
            },
            "class_insights": {
                "classes_needing_attention": class_insights["classes_needing_attention"],
                "overall_gender_ratio": class_insights["overall_gender_ratio"],
                "problematic_classes": [
                    c for c in class_insights["class_insights"]
                    if c["issues"]
                ][:5]  # Top 5 problematic classes
            },
            "generated_at": datetime.now().isoformat()
        }

    @staticmethod
    def _convert_decimals_to_float(obj):
        """Recursively convert Decimal objects to float for JSON serialization"""
        from decimal import Decimal

        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, dict):
            return {key: AnalyticsService._convert_decimals_to_float(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [AnalyticsService._convert_decimals_to_float(item) for item in obj]
        else:
            return obj

    @staticmethod
    async def cache_analytics(
        db: AsyncSession,
        report_type: str,
        parameters: Dict[str, Any],
        result_data: Dict[str, Any],
        ttl_seconds: int = 86400  # 24 hours
    ) -> None:
        """
        Cache analytics results for performance

        Args:
            report_type: Type of analytics report
            parameters: Query parameters used
            result_data: The analytics result to cache
            ttl_seconds: Time to live in seconds
        """
        expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)

        # Convert Decimals to floats for JSON serialization
        serializable_data = AnalyticsService._convert_decimals_to_float(result_data)

        # Check if cache entry exists
        stmt = select(AnalyticsCache).where(
            and_(
                AnalyticsCache.report_type == report_type,
                AnalyticsCache.parameters == parameters
            )
        )
        result = await db.execute(stmt)
        cache_entry = result.scalar_one_or_none()

        if cache_entry:
            # Update existing
            cache_entry.result_data = serializable_data
            cache_entry.computed_at = datetime.utcnow()
            cache_entry.expires_at = expires_at
        else:
            # Create new
            cache_entry = AnalyticsCache(
                report_type=report_type,
                parameters=parameters,
                result_data=serializable_data,
                computed_at=datetime.utcnow(),
                expires_at=expires_at
            )
            db.add(cache_entry)

        await db.commit()

    @staticmethod
    async def get_cached_analytics(
        db: AsyncSession,
        report_type: str,
        parameters: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached analytics if available and not expired

        Returns None if no valid cache exists
        """
        stmt = select(AnalyticsCache).where(
            and_(
                AnalyticsCache.report_type == report_type,
                AnalyticsCache.parameters == parameters,
                AnalyticsCache.expires_at > datetime.utcnow()
            )
        )
        result = await db.execute(stmt)
        cache_entry = result.scalar_one_or_none()

        if cache_entry:
            return cache_entry.result_data

        return None
