# Student Import Guide

This guide explains how to bulk import students from a CSV file into your ERPNext Education system.

## Quick Start

### 1. Create Sample CSV File

```bash
python3 import_students.py --create-sample students.csv
```

This creates a sample CSV file with example data that you can edit.

### 2. Edit CSV File

Open `students.csv` in Excel or any text editor and add your student data.

**CSV Format:**
```csv
student_name,gender,date_of_birth,program,academic_year,guardian_name,guardian_email,guardian_mobile,blood_group,address
Rahul Kumar,Male,2015-05-10,Class 5,2024-25,Rajesh Kumar,rajesh.kumar@example.com,9876543210,B+,123 Main Street
Priya Sharma,Female,2016-03-15,Class 4,2024-25,Sunita Sharma,sunita.sharma@example.com,9876543211,A+,456 Park Road
```

### 3. Test Import (Dry Run)

```bash
python3 import_students.py \
    --site school.localhost \
    --csv students.csv \
    --project santosh-school_main \
    --dry-run
```

This will validate your CSV without actually importing data.

### 4. Import Students

```bash
python3 import_students.py \
    --site school.localhost \
    --csv students.csv \
    --project santosh-school_main
```

This will import all students from the CSV file.

## CSV Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| student_name | Yes | Full name of student | Rahul Kumar |
| gender | Yes | Male/Female | Male |
| date_of_birth | Yes | Format: YYYY-MM-DD | 2015-05-10 |
| program | Yes | Program name (must exist) | Class 5 |
| academic_year | Yes | Academic year | 2024-25 |
| guardian_name | Recommended | Parent/Guardian name | Rajesh Kumar |
| guardian_email | Recommended | Guardian email | rajesh@example.com |
| guardian_mobile | Optional | Guardian mobile | 9876543210 |
| blood_group | Optional | Blood group | B+ |
| address | Optional | Address | 123 Main Street |

## Available Programs

The following programs are automatically created during setup:
- Playgroup, Nursery, LKG, UKG
- Class 1 through Class 10
- Class 11 Science, Class 11 Commerce, Class 11 Arts
- Class 12 Science, Class 12 Commerce, Class 12 Arts

## Features

### Automatic Email Generation
- If student email is not provided, it will be auto-generated
- Format: firstname.lastname.ID@students.school (e.g., rahul.kumar.1@students.school)
- This ensures each student has a unique email address
- You can provide custom emails in the CSV if needed

### Automatic Guardian Creation
- If guardian doesn't exist, it will be created automatically
- If guardian already exists (by name), it will be linked to the student
- Guardian information is optional but recommended

### Automatic Enrollment
- Students are automatically enrolled in the specified program
- Enrollment date is set to today
- If student is already enrolled, enrollment is skipped

### Duplicate Prevention
- Script checks if student already exists before creating
- Checks if student is already enrolled in program before enrolling
- Safe to run multiple times with same data

### Error Handling
- Each student is processed independently
- If one student fails, others continue to process
- Detailed error messages for troubleshooting
- Database rollback on error to maintain data integrity

## Examples

### Example 1: Import Students from Excel

1. Create your Excel file with student data:
   ```
   Student Name    Gender  DOB         Program    Academic Year  Guardian Name  Guardian Email           Mobile      Blood  Address
   Rahul Kumar     Male    2015-05-10  Class 5    2024-25        Rajesh Kumar   rajesh@example.com       9876543210  B+     123 Main St
   Priya Sharma    Female  2016-03-15  Class 4    2024-25        Sunita Sharma  sunita@example.com       9876543211  A+     456 Park Rd
   ```

2. Save as CSV (File > Save As > CSV)

3. Import:
   ```bash
   python3 import_students.py --site school.localhost --csv your_file.csv --project santosh-school_main
   ```

### Example 2: Import Multiple Classes

Create separate CSV files for each class or combine them:

```csv
student_name,gender,date_of_birth,program,academic_year,guardian_name,guardian_email,guardian_mobile,blood_group,address
Amit Singh,Male,2014-08-20,Class 6,2024-25,Vijay Singh,vijay@example.com,9876543212,O+,789 Garden St
Neha Gupta,Female,2014-09-15,Class 6,2024-25,Rakesh Gupta,rakesh@example.com,9876543213,A-,321 Lake View
Ravi Kumar,Male,2013-07-10,Class 7,2024-25,Suresh Kumar,suresh@example.com,9876543214,B+,555 Hill Road
```

### Example 3: Import Without Guardian

If you don't have guardian information yet, you can skip those fields:

```csv
student_name,gender,date_of_birth,program,academic_year,guardian_name,guardian_email,guardian_mobile,blood_group,address
Amit Singh,Male,2014-08-20,Class 6,2024-25,,,,,
```

Guardian can be added later through the ERPNext UI.

## Troubleshooting

### Error: "Program not found"

**Problem:** The program name in CSV doesn't match exactly

**Solution:** Check program names:
```bash
docker compose -p santosh-school_main exec -T backend bench --site school.localhost console <<EOF
import frappe
frappe.init(site='school.localhost')
frappe.connect()
programs = frappe.get_all('Program', fields=['name'])
for p in programs:
    print(p.name)
frappe.destroy()
EOF
```

### Error: "Student already exists"

**Problem:** Student with same first and last name exists

**Solution:** This is expected behavior. The script skips duplicate students. Check the ERPNext UI to verify existing student.

### Error: "Invalid date format"

**Problem:** Date is not in YYYY-MM-DD format

**Solution:** Ensure dates are formatted as: 2015-05-10 (not 10/05/2015 or 05-10-2015)

### Error: "Gender field required"

**Problem:** Gender field is empty or invalid

**Solution:** Use exactly "Male" or "Female" (case-sensitive)

## System Configuration

**Note:** The system is configured to NOT create user accounts for students automatically. This means:
- Students will NOT receive login credentials by email
- Students will NOT be able to log into the system
- This is intentional to keep things simple for bulk imports
- If you need student portal access, you can enable it later in Education Settings

## Tips

1. **Start Small:** Test with 2-3 students first before importing hundreds
2. **Use Dry Run:** Always test with `--dry-run` first
3. **Backup First:** Take a backup before large imports
4. **Check Programs:** Verify program names exist before importing
5. **Validate CSV:** Open CSV in text editor to check formatting
6. **One Class at a Time:** Import one class first to catch any issues
7. **Email Field:** Student emails are auto-generated if not provided in CSV

## Getting Help

If you encounter issues:

1. Check the error message carefully
2. Verify CSV format matches exactly
3. Use dry run mode to test
4. Check that programs exist in the system
5. Verify guardian email addresses are valid

## Advanced Usage

### Custom Project Name

If your project has a different name:
```bash
python3 import_students.py --site school.localhost --csv students.csv --project your-project-name
```

### Different Site Name

If you used a different site name during deployment:
```bash
python3 import_students.py --site your.domain.com --csv students.csv --project santosh-school_main
```

### Multiple Academic Years

You can import students from different academic years in the same CSV:
```csv
student_name,gender,date_of_birth,program,academic_year,...
Rahul Kumar,Male,2015-05-10,Class 5,2024-25,...
Amit Singh,Male,2014-08-20,Class 6,2023-24,...
```

## Best Practices

1. **Data Validation:** Verify all data in Excel before exporting to CSV
2. **Test First:** Always use dry run mode with a small subset
3. **Backup:** Take database backup before large imports
4. **Incremental:** Import in batches (50-100 students at a time)
5. **Review:** Check imported students in ERPNext UI after import
6. **Document:** Keep original Excel file as reference

## Batch Import Example

For large datasets (500+ students):

1. Split into smaller files:
   ```bash
   # Split students.csv into files of 100 students each
   split -l 101 students.csv student_batch_
   ```

2. Import each batch:
   ```bash
   for file in student_batch_*; do
       python3 import_students.py --site school.localhost --csv $file --project santosh-school_main
       sleep 5  # Wait between batches
   done
   ```

## Summary

The student import script provides:
- ✓ Bulk import from CSV
- ✓ Automatic guardian creation/linking
- ✓ Automatic program enrollment
- ✓ Duplicate detection
- ✓ Error handling and recovery
- ✓ Dry run testing
- ✓ Detailed logging

For additional help or questions, refer to the main [README.md](README.md).
