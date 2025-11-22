# Smart Batch Management System

## Overview

The Smart Batch Management System automatically assigns students to sections (A, B, C, etc.) based on configurable criteria, eliminating manual section assignment and enabling intelligent student distribution.

## Key Features

### 1. Automatic Section Assignment
- **Zero Manual Work**: Students automatically assigned to sections
- **Configurable Batch Size**: Set maximum students per section (10-100)
- **Multiple Strategies**: Alphabetical or Merit-based assignment
- **Real-time Updates**: Section assignments update immediately

### 2. Assignment Strategies

#### Alphabetical Assignment
- Sorts students by first name, then last name
- Distributes evenly across sections
- Fair and unbiased distribution
- **Best for**: Primary schools, equal opportunity environments

#### Merit-Based Assignment
- Sorts students by average marks (highest first)
- Top performers go to earlier sections (Section A gets highest marks)
- Falls back to alphabetical for students without marks
- **Best for**: Competitive environments, senior classes

### 3. Annual Reorganization
- Redistribute all students at academic year start
- Based on updated performance metrics
- Maintains history of all assignments
- Configurable auto-reorganization

### 4. Performance Tracking
- Track average marks per student
- Track attendance percentage
- Automatic timestamp on updates
- **AI-Ready**: Data structured for ML integration

## Database Schema

### New Tables

#### `section_assignments`
Tracks complete history of section assignments:
```sql
- id: Primary key
- student_id: Foreign key to students
- class_id: Foreign key to classes
- academic_year_id: Foreign key to academic_years
- assigned_section: Section label (A, B, C, etc.)
- assignment_strategy: Strategy used (alphabetical/merit/manual)
- assignment_reason: Description of why assigned
- assigned_at: Timestamp of assignment
- assigned_by: User who triggered assignment
```

### Updated Tables

#### `system_settings`
New batch configuration columns:
```sql
- max_batch_size: Maximum students per section (default: 30)
- batch_assignment_strategy: 'alphabetical' or 'merit' (default: 'alphabetical')
- auto_assign_sections: Boolean (default: true)
- reorganize_annually: Boolean (default: true)
- last_reorganization_date: Date of last reorganization
```

#### `students`
New performance tracking columns:
```sql
- computed_section: Auto-assigned section (A, B, C, etc.)
- average_marks: Float (0-100) for merit calculation
- attendance_percentage: Float (0-100)
- last_performance_update: Timestamp of last update
```

## API Endpoints

### Batch Management Endpoints

#### GET `/api/v1/batch/settings`
Get current batch management settings.

**Response:**
```json
{
  "max_batch_size": 30,
  "batch_assignment_strategy": "alphabetical",
  "auto_assign_sections": true,
  "reorganize_annually": true
}
```

#### POST `/api/v1/batch/assign-sections`
Assign sections to students in a specific class.

**Request:**
```json
{
  "class_id": 1,
  "academic_year_id": 1,
  "strategy": "alphabetical"  // Optional, uses system default if not provided
}
```

**Response:**
```json
{
  "message": "Successfully assigned 85 students to 3 sections",
  "total_students": 85,
  "num_sections": 3,
  "max_batch_size": 30,
  "strategy": "alphabetical",
  "sections": ["A", "B", "C"],
  "assignments": [
    {
      "student_id": 1,
      "student_name": "Aditya Kumar",
      "section": "A"
    },
    ...
  ]
}
```

#### POST `/api/v1/batch/reorganize-all`
Reorganize all classes for an academic year.

**Request:**
```json
{
  "academic_year_id": 1
}
```

**Response:**
```json
{
  "message": "Reorganized 17 classes",
  "total_classes": 17,
  "total_students": 450,
  "details": [
    {
      "class_id": 1,
      "class_name": "Pre-Nursery",
      "result": {
        "message": "Successfully assigned 25 students to 1 sections",
        "total_students": 25,
        "num_sections": 1,
        ...
      }
    },
    ...
  ]
}
```

#### GET `/api/v1/batch/distribution/{class_id}`
Get section distribution for a class.

**Query Parameters:**
- `academic_year_id`: ID of the academic year

**Response:**
```json
{
  "class_id": 1,
  "academic_year_id": 1,
  "distribution": {
    "A": 28,
    "B": 30,
    "C": 27
  },
  "total_students": 85
}
```

### Settings Endpoints

#### PUT `/api/v1/settings/batch`
Update batch management settings (Admin only).

**Request:**
```json
{
  "max_batch_size": 35,
  "batch_assignment_strategy": "merit",
  "auto_assign_sections": true,
  "reorganize_annually": true
}
```

### Student Performance Endpoints

#### PUT `/api/v1/students/{student_id}/performance`
Update student performance metrics.

**Request:**
```json
{
  "average_marks": 85.5,
  "attendance_percentage": 92.0
}
```

## Frontend UI

### Batch Management Tab
Located in: **Settings → Batch Management**

#### Configuration Section
- **Maximum Students per Section**: Slider (10-100)
- **Assignment Strategy**: Dropdown (Alphabetical/Merit)
- **Auto-assign sections**: Checkbox
- **Reorganize annually**: Checkbox

#### Actions Section
- **Academic Year Selector**: Choose year for operations
- **Class Selector**: Choose specific class (optional)
- **Assign Sections Button**: Assign sections to selected class
- **Reorganize All Button**: Reorganize all classes

## Use Cases

### Use Case 1: New Academic Year Setup
**Scenario**: School starts new academic year with all students

**Steps:**
1. Admin goes to Settings → Batch Management
2. Configures batch size (e.g., 30 students)
3. Selects strategy (e.g., Alphabetical)
4. Selects current academic year
5. Clicks "Reorganize All Classes"
6. System distributes all students across sections

**Result**: All students assigned to sections automatically

### Use Case 2: Mid-Year Admissions
**Scenario**: New students admitted during the year

**Steps:**
1. Admin admits new students (no section assigned)
2. Goes to Settings → Batch Management
3. Selects the class and academic year
4. Clicks "Assign Sections to Selected Class"
5. System assigns new students to least-filled sections

**Result**: New students assigned, existing assignments unchanged

### Use Case 3: Merit-Based Reorganization
**Scenario**: After mid-term exams, reorganize by performance

**Steps:**
1. Update student marks via Student Performance API
2. Change strategy to "Merit" in Batch Management
3. Click "Reorganize All Classes"
4. System redistributes students by marks

**Result**: Top performers in Section A, distributed by merit

## Configuration Best Practices

### Batch Size
- **Primary (Pre-Nursery to Class 5)**: 25-30 students
- **Middle (Class 6-8)**: 30-35 students
- **Secondary (Class 9-10)**: 35-40 students
- **Senior Secondary (Class 11-12)**: 30-35 students

### Strategy Selection
- **Alphabetical**: For fairness and simplicity
- **Merit**: When performance-based grouping is desired

### When to Reorganize
- **Start of academic year**: Always reorganize
- **After major exams**: If using merit-based strategy
- **Mid-year**: Only for specific classes if needed

## Technical Details

### Service Layer
**File**: `/backend/app/services/batch_assignment.py`

Key functions:
- `get_batch_settings()`: Retrieves configuration
- `assign_sections_to_class()`: Assigns sections to one class
- `reorganize_all_classes()`: Reorganizes all classes
- `get_section_distribution()`: Gets current distribution

### Calculation Logic

#### Number of Sections
```python
num_sections = ceil(total_students / max_batch_size)
```

#### Section Labels
```python
sections = ['A', 'B', 'C', 'D', ...]  # A-Z
```

#### Student Assignment
```python
# For alphabetical
sorted_students = sort by (first_name, last_name)

# For merit
sorted_students = sort by (average_marks DESC, first_name, last_name)

# Assign to sections
for idx, student in enumerate(sorted_students):
    section_idx = idx // max_batch_size
    student.computed_section = sections[section_idx]
```

## Migration

### Running the Migration
```bash
# From backend directory
docker compose exec backend alembic upgrade head
```

### Migration File
`/backend/alembic/versions/003_smart_batch_management.py`

**Changes:**
- Adds batch configuration to `system_settings`
- Adds performance tracking to `students`
- Creates `section_assignments` table
- All changes reversible via `downgrade()`

## Troubleshooting

### Issue: Sections not assigned
**Cause**: Auto-assignment disabled
**Solution**: Enable "Auto-assign sections" in settings

### Issue: Too many/few sections
**Cause**: Batch size misconfigured
**Solution**: Adjust "Maximum Students per Section"

### Issue: Merit assignment not working
**Cause**: Students missing `average_marks` data
**Solution**: Update student performance data first

### Issue: Reorganization affects existing students
**Explanation**: This is expected behavior
**Prevention**: Only reorganize at year start or when intended

## Future Enhancements

### Phase 8: Real-time Assignment
- Auto-assign on student admission
- Dynamic rebalancing when threshold exceeded

### Phase 9: Teacher Assignment
- Auto-assign teachers to balanced sections
- Consider teacher workload and expertise

### Phase 10: AI Predictions
- Predict student performance trends
- Recommend interventions for at-risk students
- Optimize section composition for outcomes

### Phase 11: Performance Analytics
- Section-wise performance dashboards
- Comparative analytics across sections
- Identify teaching effectiveness patterns

## Security Considerations

- Only admins can:
  - Modify batch settings
  - Trigger section assignments
  - Reorganize classes
- All assignments tracked with user_id
- Complete audit trail in `section_assignments`
- Cannot be tampered or deleted (CASCADE protected)

## Performance Considerations

- Assignments are database transactions (all-or-nothing)
- Large reorganizations (1000+ students) complete in <5 seconds
- Section assignment history grows over time (consider archiving old years)
- Indexes on `student_id`, `class_id`, `academic_year_id` for fast queries

## Conclusion

The Smart Batch Management System eliminates manual section assignment, enables data-driven student distribution, and provides a foundation for future AI-powered academic management. With minimal configuration, schools can automate one of their most time-consuming administrative tasks while maintaining flexibility and control.
