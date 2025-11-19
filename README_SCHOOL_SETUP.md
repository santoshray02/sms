# ERPNext School - Complete Setup

## Problem
Your ERPNext installation is missing school-specific features.

## Solution

### Fresh Install (Recommended)

**Step 1:** Edit `.school.conf` (optional but recommended):
```bash
# Set custom domain if needed
CUSTOM_DOMAIN="internal3.paperentry.ai"

# Optional: Enable automatic SSL (requires domain pointing to server)
SSL_ENABLED=true
SSL_EMAIL="admin@yourdomain.com"
```

**Step 2:** Run one command that does EVERYTHING:
```bash
./manage.sh install
```

This will:
- Create Docker containers
- Install ERPNext + Education app
- Create all school data
- Configure everything (including custom domain and SSL if enabled)

### Existing Install
If ERPNext is already installed:

```bash
./install-education-and-setup.sh
```

### Fee Structures Only
If you completed Setup Wizard but need to create fee structures:

```bash
./manage.sh setup-fees
```

## What This Does
1. Installs Education App (https://github.com/frappe/education)
2. Creates Academic Year & Terms (2024-25)
3. Creates 20 CBSE Programs (Playgroup → Class 12)
4. Creates 19 CBSE Courses
5. Sets up 23 Classrooms & 20 Student Batches
6. Configures 11 Fee Categories & Fee Structures
7. Creates Student Categories (General, SC, ST, OBC, EWS)
8. Creates 3 Gender Master Data (Male, Female, Other)
9. Creates 5 Sample Users with proper roles
10. Creates 3 Instructor records for teachers
11. Creates 5 Sample Students with Guardians & Enrollments
12. Hides non-school modules via Desktop Icon blocking
13. Configures Education Settings

**Time**: 10-15 minutes (fresh) or 7-10 minutes (existing)

## After Setup

**Login at**: http://localhost:8080

| User | Email | Password |
|------|-------|----------|
| Principal | principal@school.local | principal123 |
| Teacher | teacher1@school.local | teacher123 |
| Accountant | accountant@school.local | accounts123 |

⚠️ **Change passwords immediately!**

## Files

**Run This:**
- `./manage.sh install` - Fresh install (does EVERYTHING automatically)
- `./manage.sh setup-fees` - Fee structures only (after Setup Wizard)
- `install-education-and-setup.sh` - Existing install (Education + data)
- `setup-now.sh` - Data setup only (if Education already installed)

**Documentation:**
- `SETUP.md` - Detailed guide
- `SUMMARY.md` - Quick overview
- `QUICK_SETUP.md` - Daily tasks reference

**Keep These:**
- `complete_school_setup.py` - Setup script (used by install scripts)
- `manage.sh` - Container management and installation
- `import_students.py` - Bulk student import (auto-creates Gender data)

## What You Get

**Academic Structure:**
- ✅ Academic Year & 2 Terms (2024-25)
- ✅ 20 CBSE Programs (Pre-Primary to Class 12)
- ✅ 19 CBSE Courses (all subjects)
- ✅ 23 Classrooms (including labs)
- ✅ 20 Student Batches

**Fee Management:**
- ✅ 11 Fee Categories (Tuition, Admission, Transport, etc.)
- ✅ Fee Structures for all programs (₹500-1200/month)

**Master Data:**
- ✅ 5 Student Categories (General, SC, ST, OBC, EWS)
- ✅ 3 Gender records (Male, Female, Other)

**Users & Access:**
- ✅ 5 Sample Users (Principal, 3 Teachers, Accountant)
- ✅ 3 Instructor records for course management

**Sample Data:**
- ✅ 5 Sample Students with Guardians
- ✅ Program Enrollments configured

**Interface:**
- ✅ Clean interface (non-school modules hidden)
- ✅ Education Settings configured

## Quick Commands

```bash
# Fresh install (does everything)
./manage.sh install

# Or existing install
./install-education-and-setup.sh

# Check status
./manage.sh status

# View logs
./manage.sh logs

# Restart
./manage.sh restart

# Check installed apps
docker exec santosh_main_school-backend-1 bench --site school.localhost list-apps
```

## Support
- Education App: https://github.com/frappe/education
- Frappe Docs: https://docs.frappe.io
- Forum: https://discuss.frappe.io
