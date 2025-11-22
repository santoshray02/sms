"""
Batch Assignment Service

Handles automatic assignment of students to sections (batches) based on:
- Alphabetical order (by name)
- Merit-based (by average marks)
- Configurable batch size

This is the core logic for smart batch management that eliminates
manual section assignment and supports annual reorganization.
"""
from typing import List, Literal, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update, func
from datetime import date
from app.models.student import Student
from app.models.academic import Class, AcademicYear
from app.models.sms import SystemSetting
from app.models.batch import SectionAssignment


async def get_batch_settings(db: AsyncSession) -> dict:
    """Get batch management settings from system settings"""
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "system")
    )
    settings = result.scalar_one_or_none()

    if not settings:
        # Return defaults
        return {
            "max_batch_size": 30,
            "batch_assignment_strategy": "alphabetical",
            "auto_assign_sections": True,
            "reorganize_annually": True
        }

    return {
        "max_batch_size": settings.max_batch_size or 30,
        "batch_assignment_strategy": settings.batch_assignment_strategy or "alphabetical",
        "auto_assign_sections": settings.auto_assign_sections if settings.auto_assign_sections is not None else True,
        "reorganize_annually": settings.reorganize_annually if settings.reorganize_annually is not None else True
    }


async def assign_sections_to_class(
    db: AsyncSession,
    class_id: int,
    academic_year_id: int,
    strategy: Optional[Literal["alphabetical", "merit"]] = None,
    assigned_by: Optional[int] = None
) -> dict:
    """
    Automatically assign sections to all students in a class

    Args:
        db: Database session
        class_id: ID of the class
        academic_year_id: ID of the academic year
        strategy: Assignment strategy (if None, uses system setting)
        assigned_by: User ID who triggered the assignment (for manual triggers)

    Returns:
        dict with assignment summary
    """
    # Get settings
    settings = await get_batch_settings(db)
    strategy = strategy or settings["batch_assignment_strategy"]
    max_batch_size = settings["max_batch_size"]

    # Get all active students in this class and academic year
    result = await db.execute(
        select(Student).where(
            and_(
                Student.class_id == class_id,
                Student.academic_year_id == academic_year_id,
                Student.status == "active"
            )
        )
    )
    students = result.scalars().all()

    if not students:
        return {"message": "No students found in this class", "assigned": 0}

    # Sort students based on strategy
    if strategy == "alphabetical":
        sorted_students = sorted(students, key=lambda s: (s.first_name, s.last_name))
        reason = "Alphabetical order by name"
    elif strategy == "merit":
        # Sort by average marks (descending), then alphabetically for those without marks
        sorted_students = sorted(
            students,
            key=lambda s: (
                -(s.average_marks or 0),  # Higher marks first
                s.first_name,
                s.last_name
            )
        )
        reason = "Merit-based on average marks"
    else:
        sorted_students = list(students)
        reason = "Default assignment"

    # Calculate number of sections needed
    total_students = len(sorted_students)
    num_sections = (total_students + max_batch_size - 1) // max_batch_size  # Ceiling division

    # Assign sections (A, B, C, etc.)
    section_labels = [chr(65 + i) for i in range(num_sections)]  # A, B, C, ...

    assignments = []
    for idx, student in enumerate(sorted_students):
        section_idx = idx // max_batch_size
        section = section_labels[section_idx] if section_idx < len(section_labels) else "Z"

        # Update student's computed section
        student.computed_section = section

        # Create assignment record
        assignment = SectionAssignment(
            student_id=student.id,
            class_id=class_id,
            academic_year_id=academic_year_id,
            assigned_section=section,
            assignment_strategy=strategy,
            assignment_reason=reason,
            assigned_by=assigned_by
        )
        db.add(assignment)
        assignments.append({
            "student_id": student.id,
            "student_name": f"{student.first_name} {student.last_name}",
            "section": section
        })

    # Update last reorganization date
    await db.execute(
        update(SystemSetting)
        .where(SystemSetting.key == "system")
        .values(last_reorganization_date=date.today())
    )

    await db.commit()

    return {
        "message": f"Successfully assigned {total_students} students to {num_sections} sections",
        "total_students": total_students,
        "num_sections": num_sections,
        "max_batch_size": max_batch_size,
        "strategy": strategy,
        "sections": section_labels,
        "assignments": assignments
    }


async def reorganize_all_classes(
    db: AsyncSession,
    academic_year_id: int,
    assigned_by: Optional[int] = None
) -> dict:
    """
    Reorganize all classes for an academic year

    This is typically called at the start of a new academic year
    to redistribute students across sections.
    """
    # Get all classes
    result = await db.execute(select(Class))
    classes = result.scalars().all()

    results = []
    total_students_assigned = 0

    for class_ in classes:
        result = await assign_sections_to_class(
            db, class_.id, academic_year_id, assigned_by=assigned_by
        )
        results.append({
            "class_id": class_.id,
            "class_name": class_.name,
            "result": result
        })
        total_students_assigned += result.get("total_students", 0)

    return {
        "message": f"Reorganized {len(classes)} classes",
        "total_classes": len(classes),
        "total_students": total_students_assigned,
        "details": results
    }


async def get_section_distribution(
    db: AsyncSession,
    class_id: int,
    academic_year_id: int
) -> dict:
    """Get current section distribution for a class"""
    result = await db.execute(
        select(Student.computed_section, func.count(Student.id))
        .where(
            and_(
                Student.class_id == class_id,
                Student.academic_year_id == academic_year_id,
                Student.status == "active"
            )
        )
        .group_by(Student.computed_section)
        .order_by(Student.computed_section)
    )

    distribution = {}
    for section, count in result:
        distribution[section or "Unassigned"] = count

    return {
        "class_id": class_id,
        "academic_year_id": academic_year_id,
        "distribution": distribution,
        "total_students": sum(distribution.values())
    }
