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

✅ **20 CBSE Programs**
- Pre-Primary: Playgroup, Nursery, LKG, UKG
- Primary: Class 1-5
- Middle: Class 6-8
- High School: Class 9-10
- Senior Secondary: Class 11-12 (Science/Commerce/Arts)

✅ **19 CBSE Courses**
- English, Hindi, Mathematics, EVS
- Science, Social Science, Sanskrit
- Physics, Chemistry, Biology
- Accountancy, Business Studies, Economics
- History, Geography, Political Science, Psychology
- Computer Science, Physical Education

✅ **23 Classrooms**
- One for each class level
- Science Lab, Computer Lab, Library

✅ **Fee Structures**
- Pre-configured for all programs
- Based on CBSE standards

✅ **Sample Data**
- 5 Users (Principal, Teachers, Accountant)
- 5 Students with Guardians
- Ready for fee collection

✅ **Clean Interface**
- Non-school modules hidden
- Focus on Education & Accounting only

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
