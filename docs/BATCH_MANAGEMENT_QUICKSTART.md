# Batch Management - Quick Start Guide

## What is Batch Management?

Batch Management automatically assigns students to sections (A, B, C, etc.) without manual intervention. Instead of manually creating "Class 1 A", "Class 1 B", you simply have "Class 1" and the system distributes students automatically.

## 5-Minute Setup

### Step 1: Access Settings
1. Login as admin
2. Navigate to **Settings** (gear icon in navigation)
3. Click on **Batch Management** tab

### Step 2: Configure
**Recommended Settings:**
- Max Students per Section: `30`
- Assignment Strategy: `Alphabetical`
- ✅ Auto-assign sections
- ✅ Reorganize annually

Click **Save Settings**

### Step 3: Assign Sections
1. Select current **Academic Year**
2. Leave **Class** empty for all classes
3. Click **"Reorganize All Classes"**
4. Confirm the action

✨ Done! All students now have sections assigned.

## How It Works

### Before Batch Management
```
Manual Process:
1. Create Class 1 A
2. Create Class 1 B
3. Manually move students to sections
4. Repeat for every class
5. Reorganize next year manually
```

### After Batch Management
```
Automatic Process:
1. Create Class 1 (no section)
2. Click "Reorganize All"
3. System assigns sections automatically
4. Done!
```

## Two Assignment Strategies

### 1. Alphabetical (Default)
**Best for**: Primary schools, fairness

**How it works**:
- Sorts students A to Z by first name
- Distributes evenly: First 30 → Section A, Next 30 → Section B, etc.

**Example** (30 students per section):
- Aditya Kumar → Section A
- Anjali Singh → Section A
- ...
- (After 30 students)
- Priya Gupta → Section B
- Rahul Verma → Section B

### 2. Merit-Based
**Best for**: Senior classes (9-12), competitive environments

**How it works**:
- Sorts students by average marks (highest first)
- Top performers → Section A, Next → Section B, etc.

**Example** (30 students per section):
- Ravi (95%) → Section A
- Meera (93%) → Section A
- ...
- (After 30 students)
- Amit (75%) → Section B
- Neha (72%) → Section B

## Common Scenarios

### Scenario 1: New Academic Year
**When**: Start of academic year

**Steps**:
1. Settings → Batch Management
2. Select new academic year
3. Click "Reorganize All Classes"

**Result**: All students redistributed fresh

### Scenario 2: New Student Admission
**When**: Student admitted mid-year

**Steps**:
1. Admit student (section will be empty)
2. Settings → Batch Management
3. Select that specific class
4. Click "Assign Sections to Selected Class"

**Result**: New student assigned to least-filled section

### Scenario 3: After Mid-Term Exams
**When**: Want to reorganize by performance

**Steps**:
1. Update student marks first
2. Settings → Batch Management
3. Change strategy to "Merit"
4. Click "Reorganize All Classes"

**Result**: Students redistributed by marks

## Viewing Section Assignments

### In Student List
- Section shows in student table
- Look for "Section" column showing A, B, C, etc.

### In Reports
- All reports now include section information
- Filter by class and see section distribution

## Tips & Best Practices

### ✅ DO:
- Reorganize at start of each academic year
- Use alphabetical for fairness
- Use merit for competitive classes
- Keep batch size 25-35 for best results

### ❌ DON'T:
- Reorganize mid-year unless necessary
- Set batch size too large (>50) or too small (<15)
- Mix strategies within same academic year
- Manually edit `computed_section` field

## Troubleshooting

### "No sections assigned"
**Solution**: Auto-assign might be off. Enable it in settings and run assignment.

### "Too many sections created"
**Solution**: Increase batch size. If you have 100 students with batch size 20, you'll get 5 sections!

### "Merit not working"
**Solution**: Students need `average_marks` data. Update student performance first.

## Performance Tracking

### Updating Student Performance
For merit-based assignment, you need to track performance:

**Via API**:
```bash
PUT /api/v1/students/{id}/performance
{
  "average_marks": 85.5,
  "attendance_percentage": 92.0
}
```

**When to Update**:
- After unit tests
- After mid-term exams
- After final exams
- Monthly for continuous assessment

## Advanced: API Usage

### Get Batch Settings
```bash
GET /api/v1/batch/settings
```

### Assign Sections to Specific Class
```bash
POST /api/v1/batch/assign-sections
{
  "class_id": 5,
  "academic_year_id": 1,
  "strategy": "alphabetical"
}
```

### Reorganize All Classes
```bash
POST /api/v1/batch/reorganize-all
{
  "academic_year_id": 1
}
```

### Check Section Distribution
```bash
GET /api/v1/batch/distribution/5?academic_year_id=1
```

## FAQs

### Q: Can I manually override a section assignment?
**A**: Yes, edit the student and set a specific section. It won't change unless you reorganize.

### Q: What happens to existing sections when I reorganize?
**A**: All students get reassigned. Old assignments are saved in history.

### Q: How many sections can I have?
**A**: Unlimited! System uses A-Z labels. For >26 sections, it continues with AA, AB, etc.

### Q: Does this work with multiple academic years?
**A**: Yes! Each year has independent section assignments.

### Q: Can I go back to old section assignments?
**A**: History is preserved in `section_assignments` table, but you'd need to manually revert.

### Q: What if I want 3 specific sections regardless of student count?
**A**: This system is dynamic. For fixed sections, adjust batch size to distribute students across desired number.

## Formula Reference

### Number of Sections Created
```
sections = ceil(total_students / max_batch_size)
```

**Examples**:
- 85 students ÷ 30 batch size = 3 sections (A, B, C)
- 45 students ÷ 30 batch size = 2 sections (A, B)
- 150 students ÷ 30 batch size = 5 sections (A, B, C, D, E)

## Support

For detailed documentation, see [BATCH_MANAGEMENT.md](./BATCH_MANAGEMENT.md)

For issues or questions, check the main [README.md](../README.md)
