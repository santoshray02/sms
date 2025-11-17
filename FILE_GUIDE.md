# File Guide - What's What

## 🚀 Scripts to Run

### Primary Script
- **`./manage.sh install`** ⭐ **USE THIS FOR FRESH INSTALL**
  - Complete one-command installation
  - Installs ERPNext + Education app + all school data
  - Uses `.school.conf` for configuration
  - Time: 10-15 minutes

### Alternative Scripts
- **`install-education-and-setup.sh`**
  - For existing ERPNext installations only
  - Installs Education app + creates school data
  - Time: 7-10 minutes

- **`setup-now.sh`**
  - Data setup only (Education app must exist)
  - Use when Education app already installed
  - Time: 2-3 minutes

- **`manage.sh`**
  - Container management tool
  - Commands: start, stop, restart, logs, shell, recreate, rebuild, reset
  - Daily operations and advanced commands

- **`import_students.py`**
  - Bulk student import from CSV
  - Automatically ensures Gender master data exists
  - Use after setup to add many students at once

## 📚 Documentation (Pick One)

### Quick Start
- **`README_SCHOOL_SETUP.md`** ⭐ **READ THIS FIRST**
  - Simplest guide with everything you need
  - One page, easy to follow

### Detailed Guides
- **`SETUP.md`**
  - Complete setup guide with troubleshooting
  - Use if you want detailed explanations

- **`SUMMARY.md`**
  - Overview of entire solution
  - What was created and why

- **`QUICK_SETUP.md`**
  - Daily tasks quick reference
  - Common operations after setup

### Specialized Guides
- **`SCHOOL_SETUP_GUIDE.md`**
  - Original detailed setup documentation
  - Troubleshooting section

- **`SAMPLE_USERS_GUIDE.md`**
  - Details about sample users created
  - Login credentials reference

- **`STUDENT_IMPORT_GUIDE.md`**
  - How to bulk import students
  - CSV format guide

- **`SSL_CUSTOM_PORT_GUIDE.md`**
  - HTTPS setup on custom ports
  - Production deployment

- **`GITHUB_README.md`**
  - Documentation for GitHub
  - Project overview

## 🔧 Core Files (Don't Delete)

- **`complete_school_setup.py`**
  - Python script that creates all school data
  - Used by install-education-and-setup.sh
  - Creates: Academic Year/Terms, Programs, Courses, Classrooms,
    Fee Structures, Student Categories, Genders, Instructors,
    Sample Users, Students, Guardians, Enrollments
  - Hides non-school modules, configures Education Settings

- **`.school.conf`**
  - Your school configuration
  - Site name, ports, credentials, etc.
  - Edit before installation

- **`docker-compose.yml`**
  - Docker container configuration (MariaDB 10.8)

## 📁 Directory Structure

```
erpnext-school/
├── manage.sh                        ⭐ PRIMARY TOOL
├── .school.conf                     ⭐ CONFIGURATION
├── install-education-and-setup.sh   (Existing installs)
├── setup-now.sh                     (Data only)
│
├── README.md                        ⭐ START HERE
├── README_SCHOOL_SETUP.md           (Setup guide)
├── QUICK_SETUP.md                   (Daily tasks)
│
├── complete_school_setup.py         (Setup logic)
├── import_students.py               (Student import)
│
└── data/                            (All deployment data)
    ├── env files
    ├── credentials
    └── docker volumes
```

## 🎯 Quick Decision Tree

**Starting fresh?**
→ Run `./manage.sh install`
→ Read `README.md`

**Education app already installed?**
→ Run `./setup-now.sh`

**Need to import many students?**
→ Use `import_students.py`
→ Read `STUDENT_IMPORT_GUIDE.md`

**Daily operations?**
→ Use `manage.sh` commands
→ Check `QUICK_SETUP.md`

**Troubleshooting?**
→ Check `SETUP.md`
→ Or `SCHOOL_SETUP_GUIDE.md`

## 📝 Recommended Reading Order

1. **`README.md`** - Start here for complete overview
2. Edit **`.school.conf`** with your settings
3. Run **`./manage.sh install`**
4. **`QUICK_SETUP.md`** - Daily operations reference
5. **`STUDENT_IMPORT_GUIDE.md`** - When adding bulk students

---

**TL;DR**: Edit `.school.conf`, run `./manage.sh install`, read `README.md`
