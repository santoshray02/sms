# ERPNext School Management System

Complete CBSE-aligned school management system with one-command deployment. Includes ERPNext, Education app, and automatic setup of all academic data.

## ⭐ What's Included

- ✅ **MariaDB 10.8**: Fully compatible with Frappe Framework
- ✅ **Complete Academic Setup**: 20 CBSE Programs, 19 Courses, Academic Year & Terms
- ✅ **Fee Management**: 11 Fee Categories, Fee Structures for all programs
- ✅ **Master Data**: Student Categories (SC/ST/OBC/EWS), Gender records
- ✅ **Sample Data**: Users (Principal, Teachers, Accountant), Students, Guardians
- ✅ **Clean Interface**: Non-school modules hidden, Education Settings configured

## 🚀 Quick Start (Recommended)

### Prerequisites

- Linux system (Ubuntu/Debian recommended)
- Docker installed
- Internet connection

### Installation

**Step 1:** Configure your school

```bash
# Edit .school.conf with your settings
vim .school.conf
```

**Step 2:** Deploy everything with one command

```bash
./manage.sh install
```

**That's it!** This command will:
1. Create Docker containers with MariaDB 10.8
2. Install ERPNext v15
3. Install Education app (https://github.com/frappe/education)
4. Setup complete school data automatically
5. Configure everything for production use

**Time**: 10-15 minutes for complete setup

### Access Your Site

After installation:

```bash
# View your login credentials
cat data/santosh_stfes-credentials.txt

# Access the site
URL: http://localhost:8080
Username: Administrator
Password: [from credentials file]
```

**Or login as:**
- Principal: principal@school.local / principal123
- Teacher: teacher1@school.local / teacher123
- Accountant: accountant@school.local / accounts123

## ⚡ Missing School Features? Fix in One Command!

After ERPNext installation, you need to:
1. Install the **Education App** (from https://github.com/frappe/education)
2. Setup CBSE programs, courses, users, etc.

### 🚀 One Command Setup

```bash
./install-education-and-setup.sh
```

**Time**: 7-10 minutes | **Result**: Fully functional school system

**📖 See [SETUP.md](SETUP.md) for complete guide**

### ⚠️ Fee Structures Setup

If you run the setup script on a fresh installation, fee structures will be skipped until you complete the ERPNext Setup Wizard (which creates the company).

**After completing Setup Wizard, run:**

```bash
./setup-fee-structures.sh
```

This creates fee structures for all 20 CBSE programs (₹500-1200/month).

### What You'll Get:

### 📚 Academic Structure
- **Academic Year 2024-25** with complete configuration
- **2 Academic Terms:** First Term (Apr-Sep), Second Term (Oct-Mar)
- **20 CBSE Programs:** Playgroup, Nursery, LKG, UKG, Class 1-10, Class 11-12 (Science/Commerce/Arts streams)
- **19 CBSE Curriculum Courses:** English, Hindi, Mathematics, Science, Social Science, Physics, Chemistry, Biology, Accountancy, Business Studies, Economics, History, Geography, Political Science, Psychology, Computer Science, Physical Education, Sanskrit, EVS
- **23 Classrooms:** Including Science Lab, Computer Lab, Library
- **20 Student Batches:** One for each program (2024-25)

### 💰 Fee Management
- **11 Fee Categories:** Tuition, Admission, Transport, Lab, Library, Sports, Exam, Computer, Activity, Development, Books
- **Fee Structures (Monthly Tuition):**
  - Pre-Primary (Playgroup-UKG): ₹500-600
  - Primary (Class 1-5): ₹650-750
  - Middle School (Class 6-8): ₹750-900
  - High School (Class 9-10): ₹1,000-1,100
  - Senior Secondary (Class 11-12): ₹900-1,200 (varies by stream)
- **Automatic Receivable Account Detection**

### 🎓 Master Data
- **5 Student Categories:** General, SC (Scheduled Caste), ST (Scheduled Tribe), OBC (Other Backward Classes), EWS (Economically Weaker Section)
- **3 Gender Records:** Male, Female, Other

### 👥 Users & Access
- **5 Sample Users with Proper Roles:**
  - **Principal:** principal@school.local / principal123 (Education Manager, System Manager)
  - **Teachers (3):** teacher1/2/3@school.local / teacher123 (Academics User, Instructor)
  - **Accountant:** accountant@school.local / accounts123 (Accounts User, Accounts Manager)
- **3 Instructor Records:** Mapped to teachers for course assignments and scheduling

### 👨‍👩‍👧‍👦 Sample Data
- **5 Sample Students:** Complete profiles with enrollment information
- **5 Guardians:** Linked to students with contact details
- **Program Enrollments:** All students enrolled in their respective programs
- **Ready for:** Attendance tracking, assessments, fee collection

### ⚙️ System Configuration
- **Enabled Modules:** Education, Accounting, Setup
- **Hidden Modules:** Manufacturing, Buying, Selling, Stock, HR, CRM, Projects, Support, Healthcare, Payroll, Assets, Quality Management, Maintenance (via Desktop Icon blocking)
- **Education Settings:** Configured with current academic year, attendance validation enabled
- **Clean Interface:** Focused on school management only!

**📖 For detailed setup instructions and troubleshooting, see:** [SCHOOL_SETUP_GUIDE.md](SCHOOL_SETUP_GUIDE.md)

## 🛠️ Managing Your Deployment

### Daily Operations

```bash
./manage.sh start      # Start services
./manage.sh stop       # Stop services
./manage.sh restart    # Restart services
./manage.sh status     # Check container status
./manage.sh logs       # View and follow logs
./manage.sh shell      # Access backend shell
./manage.sh info       # Show configuration details
```

### Advanced Commands

```bash
./manage.sh recreate   # Recreate containers (keeps data)
                       # Use after updating docker-compose.yml

./manage.sh rebuild    # Pull new images and rebuild (keeps data)
                       # Use to update ERPNext/Frappe versions

./manage.sh reset      # Complete fresh start (deletes everything)
                       # Requires typing 'DELETE' to confirm

./manage.sh set-hostname <hostname>  # Configure custom hostname
                                    # Example: internal3.paperentry.ai
```

### Key Features

- **MariaDB 10.8**: Fully compatible with Frappe Framework
- **Automatic Database Permissions**: Handles container IP changes
- **Configuration-Based**: Uses `.school.conf` for easy management
- **Persistent Data**: All data stored locally in `./data/` directory
- **Container Auto-Discovery**: No need to specify project names

### Multiple Schools

You can manage multiple schools using different config files:

```bash
# Create configs for different schools
cp .school.conf .school-main.conf
cp .school.conf .school-branch.conf

# Edit each with different SCHOOL_CODE and BASE_PORT
vim .school-main.conf    # SCHOOL_CODE="main", BASE_PORT=8080
vim .school-branch.conf  # SCHOOL_CODE="branch", BASE_PORT=8081

# Manage different schools
CONFIG_FILE=.school-main.conf ./manage.sh start
CONFIG_FILE=.school-branch.conf ./manage.sh start
```

### Container Naming

Containers use the pattern: `USERNAME_SCHOOLCODE`
- Example: `santosh_stfes-backend-1`, `santosh_stfes-db-1`, etc.
- Containers are found automatically - no need to specify project names!

### File Organization

```
erpnext-school/
├── manage.sh                    # Management script
├── docker-compose.yml           # Docker configuration (MariaDB 10.8)
├── .school.conf                 # Your configuration
├── complete_school_setup.py     # School data setup script
├── install-education-and-setup.sh  # Existing install helper
└── data/                        # All project data (portable)
    ├── username_schoolcode.env              # Environment variables
    ├── username_schoolcode-credentials.txt  # Login credentials
    └── [Docker volumes managed automatically]
```

### Custom Hostname Setup

**Option 1: Configure during installation (Recommended)**

Edit `.school.conf` before installation:

```bash
# Set your custom domain
CUSTOM_DOMAIN="internal3.paperentry.ai"

# Optional: Enable SSL (requires domain pointing to server)
SSL_ENABLED=true
SSL_EMAIL="admin@yourdomain.com"

# Then install - domain (and SSL if enabled) will be configured automatically
./manage.sh install
```

**Option 2: Set after installation**

```bash
# After installation
./manage.sh set-hostname internal3.paperentry.ai

# This automatically:
# 1. Updates site configuration
# 2. Creates hostname symlink
# 3. Restarts services
# 4. Makes site accessible at http://internal3.paperentry.ai:8080
```

### SSL/HTTPS Setup

Frappe has built-in Let's Encrypt SSL support. To enable HTTPS:

**Method 1: During installation (automatic)**

Edit `.school.conf`:
```bash
CUSTOM_DOMAIN="school.yourdomain.com"
SSL_ENABLED=true
SSL_EMAIL="admin@yourdomain.com"
```

Then run `./manage.sh install` - SSL will be configured automatically!

**Method 2: After installation (manual)**

```bash
# Edit .school.conf to set CUSTOM_DOMAIN and SSL_EMAIL
./manage.sh setup-ssl
```

**Requirements for SSL:**
- Custom domain must be set (not .localhost)
- Domain must point to your server's public IP address
- Ports 80 and 443 must be accessible from the internet
- DNS propagation must be complete

**Certificate Renewal:**
- Frappe automatically renews certificates via cron job
- Certificates are valid for 90 days
- Renewal happens automatically before expiration

## Backup & Restore

### Create Backup
```bash
./manage.sh shell
# Inside the container:
bench --site school.localhost backup
```

Backups are stored in the site directory and can be accessed from the host.

### Restore Backup
```bash
./manage.sh shell
# Inside the container:
bench --site school.localhost restore /path/to/backup.sql.gz
```

## Troubleshooting

### Forgot Admin Password?

```bash
./manage.sh shell
# Inside the container:
bench --site school.localhost set-admin-password 'NewPassword123'
```

### Site Not Loading?

Check logs:
```bash
./manage.sh logs
```

### Database Connection Issues?

If you get database connection errors after container restart:
```bash
./manage.sh restart
```

The script automatically configures database permissions to handle container IP changes.

### After Updating docker-compose.yml

When you modify `docker-compose.yml` (e.g., changing MariaDB version):
```bash
./manage.sh recreate
```

This recreates containers with new configuration while keeping your data.

### Updating ERPNext/Frappe

To update to the latest version:
```bash
./manage.sh rebuild
```

This pulls new images and rebuilds containers while preserving data.

### Complete Fresh Start

To remove everything and start fresh:
```bash
./manage.sh reset
# Type 'DELETE' to confirm
./manage.sh install
```

### Port Already in Use?

Edit `.school.conf` and change `BASE_PORT` to an available port:
```bash
vim .school.conf
# Change BASE_PORT=8080 to BASE_PORT=8090
./manage.sh recreate
```

## System Requirements

**Minimum:**
- 2GB RAM
- 2 CPU cores
- 20GB disk space

**Recommended:**
- 4GB RAM
- 4 CPU cores
- 50GB disk space
- SSD storage

## Features

### Education Module
- Student enrollment and records
- Guardian information
- Program and course management
- Fee structure and collection
- Attendance tracking
- Assessment and grading
- Academic calendar

### Accounting
- Fee collection via invoices
- Payment tracking
- Outstanding reports
- Financial statements

### Customization
- Custom fee structures per program
- Flexible academic calendar
- Multi-term support
- Stream-based senior classes

## Support & Documentation

- **ERPNext Docs:** https://docs.erpnext.com
- **Education App:** https://github.com/frappe/education
- **Frappe Forum:** https://discuss.erpnext.com
- **Docker Setup:** https://github.com/frappe/frappe_docker

## License

GNU General Public License v3.0

## Notes

- Change default passwords immediately after installation
- Set up regular backups for production use
- For production deployments, configure proper domain and SSL
- The automatic setup runs only when the `education` app is installed
- Setup is idempotent - safe to run multiple times
