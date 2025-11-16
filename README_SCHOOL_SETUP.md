# ERPNext School - Complete Setup

## Problem
Your ERPNext installation is missing school-specific features.

## Solution

### Fresh Install (Recommended)
One command does EVERYTHING from scratch:

```bash
./manage.sh install
```

This will:
- Create Docker containers
- Install ERPNext + Education app
- Create all school data
- Configure everything

### Existing Install
If ERPNext is already installed:

```bash
./install-education-and-setup.sh
```

## What This Does
1. Installs Education App (https://github.com/frappe/education)
2. Creates 20 CBSE Programs (Playgroup → Class 12)
3. Creates 19 CBSE Courses
4. Sets up 23 Classrooms
5. Configures Fee Structures
6. Creates 5 Sample Users
7. Creates 5 Sample Students
8. Hides non-school modules

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
- `install-education-and-setup.sh` - Existing install (Education + data)
- `setup-now.sh` - Data setup only (if Education already installed)

**Documentation:**
- `SETUP.md` - Detailed guide
- `SUMMARY.md` - Quick overview
- `QUICK_SETUP.md` - Daily tasks reference

**Keep These:**
- `complete_school_setup.py` - Setup script (used by above)
- `manage.sh` - Container management
- `easy-install.py` - Initial deployment
- `import_students.py` - Bulk student import

## What You Get

- ✅ 20 CBSE Programs
- ✅ 19 CBSE Courses  
- ✅ 23 Classrooms
- ✅ Fee Structures (₹500-1200/month)
- ✅ 5 Sample Users
- ✅ 5 Sample Students
- ✅ Clean interface (non-school modules hidden)

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
