# File Guide - What's What

## 🚀 Scripts to Run

### Primary Script
- **`install-education-and-setup.sh`** ⭐ **USE THIS**
  - Installs Education app + creates all school data
  - Use when starting fresh or Education app not installed
  - Time: 7-10 minutes

### Alternative Scripts
- **`setup-now.sh`**
  - Creates school data only (skips Education app install)
  - Use when Education app already installed
  - Time: 2-3 minutes

- **`manage.sh`**
  - Container management (start/stop/restart/logs/shell)
  - Daily operations tool

- **`easy-install.py`**
  - Original deployment script (already used)
  - For initial ERPNext installation

- **`import_students.py`**
  - Bulk student import from CSV
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

- **`setup_school_data.py`**
  - Original setup helper (legacy)
  - Kept for reference

- **`.school.conf`**
  - Your school configuration
  - Site name, ports, etc.

- **`docker-compose.yml`**
  - Docker container configuration

## 📁 Directory Structure

```
erpnext-school/
├── install-education-and-setup.sh  ⭐ RUN THIS
├── setup-now.sh                     (Alternative)
├── manage.sh                        (Container management)
│
├── README_SCHOOL_SETUP.md          ⭐ READ THIS
├── SETUP.md                         (Detailed guide)
├── SUMMARY.md                       (Overview)
├── QUICK_SETUP.md                   (Quick reference)
│
├── complete_school_setup.py         (Setup logic)
├── import_students.py               (Student import)
├── easy-install.py                  (Initial install)
│
└── docs/
    ├── SCHOOL_SETUP_GUIDE.md
    ├── SAMPLE_USERS_GUIDE.md
    ├── STUDENT_IMPORT_GUIDE.md
    └── SSL_CUSTOM_PORT_GUIDE.md
```

## 🎯 Quick Decision Tree

**Starting fresh?**
→ Run `./install-education-and-setup.sh`
→ Read `README_SCHOOL_SETUP.md`

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

## 🗑️ Can Be Removed (Optional)

If you want to clean up, you can safely remove:
- `GITHUB_README.md` (if not publishing to GitHub)
- `setup_school_data.py` (legacy, superseded by complete_school_setup.py)

## 📝 Recommended Reading Order

1. `README_SCHOOL_SETUP.md` - Start here
2. Run `./install-education-and-setup.sh`
3. `QUICK_SETUP.md` - After setup, for daily tasks
4. `STUDENT_IMPORT_GUIDE.md` - When you need to add students
5. `SETUP.md` - If you need troubleshooting

---

**TL;DR**: Run `./install-education-and-setup.sh` and read `README_SCHOOL_SETUP.md`
