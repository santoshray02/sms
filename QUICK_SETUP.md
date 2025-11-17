# Quick Setup Reference

## Step 1: Run Complete School Setup

```bash
./run-school-setup.sh
```

**That's it!** This single command creates everything you need.

## Step 2: Login

Open your browser and navigate to your ERPNext URL (e.g., `http://localhost:8080`)

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Principal** | principal@school.local | principal123 |
| **Teacher 1** | teacher1@school.local | teacher123 |
| **Teacher 2** | teacher2@school.local | teacher123 |
| **Teacher 3** | teacher3@school.local | teacher123 |
| **Accountant** | accountant@school.local | accounts123 |

⚠️ **Important**: Change these passwords immediately after first login!

## What Gets Created

✅ **Academic Structure**
- Academic Year: 2024-25
- Academic Terms: First Term, Second Term
- 20 CBSE Programs (Playgroup to Class 12)
- 19 CBSE Courses (all subjects)
- 23 Classrooms (including labs)
- 20 Student Batches

✅ **Fee Management**
- 11 Fee Categories (Tuition, Admission, Transport, Lab, Library, Sports, Exam, Computer, Activity, Development, Books)
- Fee Structures for all 20 programs (₹500-1200/month)
- Receivable account auto-detection

✅ **Master Data**
- 5 Student Categories: General, SC (Scheduled Caste), ST (Scheduled Tribe), OBC (Other Backward Classes), EWS (Economically Weaker Section)
- 3 Gender records: Male, Female, Other

✅ **Users & Instructors**
- 5 Sample Users with proper roles:
  - 1 Principal (Education Manager, System Manager)
  - 3 Teachers (Academics User, Instructor)
  - 1 Accountant (Accounts User, Accounts Manager)
- 3 Instructor records mapped to teachers for course management

✅ **Sample Data**
- 5 Students with complete profiles
- 5 Guardians linked to students
- Program Enrollments for all students
- Ready for attendance, assessments, and fee collection

✅ **System Configuration**
- Non-school modules hidden via Desktop Icon blocking
- Education Settings configured with current academic year
- Attendance validation enabled
- Clean, focused interface

## Quick Navigation

### For Principal
- **Dashboard**: Home → Education
- **Students**: Education → Student
- **Programs**: Education → Program
- **Courses**: Education → Course
- **Fee Management**: Accounts → Sales Invoice

### For Teachers
- **My Students**: Education → Student Group
- **Attendance**: Education → Student Attendance
- **Assessments**: Education → Assessment Plan
- **Grades**: Education → Assessment Result

### For Accountant
- **Fee Collection**: Accounts → Sales Invoice
- **Payment Entry**: Accounts → Payment Entry
- **Reports**: Accounts → Financial Statements

## Common Tasks

### Enroll a New Student

1. Go to **Education → Student** → Click **New**
2. Fill student details
3. Add guardian information
4. Save
5. Go to **Education → Program Enrollment** → Click **New**
6. Select student and program
7. Set enrollment date
8. Save

### Generate Fee Invoice

1. Go to **Accounts → Sales Invoice** → Click **New**
2. Select **Customer** (student)
3. Add **Fee Structure** items
4. Set **Due Date**
5. Save and Submit

### Mark Attendance

1. Go to **Education → Student Attendance** → Click **New**
2. Select **Student Group** or individual student
3. Set **Date**
4. Mark **Status** (Present/Absent/Half Day)
5. Save and Submit

### Create Course Schedule

1. Go to **Education → Course Schedule** → Click **New**
2. Select **Student Group**
3. Select **Course**
4. Set **Date** and **Time**
5. Assign **Instructor**
6. Select **Room**
7. Save

## Troubleshooting

### Cannot Login?
```bash
./manage.sh shell
bench --site <sitename> set-password principal@school.local principal123
```

### Need to Re-run Setup?
```bash
./run-school-setup.sh
```
(Safe to run multiple times - won't duplicate data)

### View Logs?
```bash
./manage.sh logs
```

### Restart System?
```bash
./manage.sh restart
```

## Next Steps

1. ✅ **Change all default passwords**
2. ✅ **Add more teachers and staff**
3. ✅ **Enroll real students**
4. ✅ **Customize fee structures**
5. ✅ **Create course schedules**
6. ✅ **Set up attendance tracking**
7. ✅ **Configure grading system**
8. ✅ **Generate fee invoices**

## Support

- **Full Guide**: [SCHOOL_SETUP_GUIDE.md](SCHOOL_SETUP_GUIDE.md)
- **Main README**: [README.md](README.md)
- **ERPNext Docs**: https://docs.erpnext.com
- **Forum**: https://discuss.erpnext.com

---

**Need help?** Check [SCHOOL_SETUP_GUIDE.md](SCHOOL_SETUP_GUIDE.md) for detailed instructions.
