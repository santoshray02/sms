# ERPNext Education - Easy Install

Simple one-command deployment of ERPNext Education for school management with automatic setup of programs, fee categories, and academic data.

## What's New

- ✅ **MariaDB 10.8**: Fully compatible with Frappe Framework (no compatibility warnings!)
- ✅ **Advanced Container Management**: recreate, rebuild, reset commands
- ✅ **Custom Hostname Support**: Easy setup with automatic symlink creation
- ✅ **Automatic Database Permissions**: Handles container IP changes seamlessly
- ✅ **Improved Healthchecks**: Reliable container startup detection

## Quick Start

### Prerequisites

- Linux system (Ubuntu/Debian recommended)
- Python 3.6+
- Internet connection

### Installation

One command deploys everything:

```bash
python3 ./easy-install.py deploy \
    --project=my_school \
    --email=admin@yourschool.com \
    --school-name="Your School Name" \
    --image=ghcr.io/frappe/education \
    --version=latest \
    --app=education \
    --sitename school.yourdomain.com
```

**That's it!** The script will:
1. Install Docker (if not present)
2. Download and configure Frappe Docker
3. Start all services (database, backend, frontend, redis, etc.)
4. Create your site with the Education app
5. **Automatically setup:**
   - Academic Year (2024-25)
   - Academic Terms (Term 1 & Term 2)
   - 20 Programs (Playgroup to Class 12 with streams)
   - 11 Fee Categories (Tuition, Transport, Lab, etc.)

### Access Your Site

After installation completes:

```
URL: http://localhost (or your domain)
Username: Administrator
Password: [check ~/my_school-passwords.txt]
```

View your credentials:
```bash
cat ~/my_school-passwords.txt
```

## What Gets Created Automatically

### 📚 Academic Data
- **20 Programs:** Playgroup, Nursery, LKG, UKG, Class 1-10, Class 11-12 (Science/Commerce/Arts)
- **2 Academic Terms:** First Term (Apr-Sep), Second Term (Oct-Mar)
- **12 Fee Categories:** Tuition, Admission, Transport, Lab, Library, Sports, Exam, Computer, Activity, Hostel, Development, Books

### 💰 Fee Structures (St. Francis English School Style)
**Tuition Fees (Monthly):**
- Nursery/LKG: ₹550
- UKG: ₹600
- Class 1-2: ₹650
- Class 3-4: ₹700
- Class 5-6: ₹750
- Class 7: ₹800
- Class 8: ₹900
- Class 9: ₹1,000
- Class 10: ₹1,100

**Transportation Routes (22 locations):**
- ₹450-650: Local areas (Fatehpur, Raghopur, Paharpur, etc.)
- ₹800-1,200: Mid-range (Behrampur, Jurawanpur, Mohanpur)
- ₹1,500: Long distance (Rupas Mahaji)

### 👥 Sample Users (Ready to Login)
- **Principal:** principal@school.local / principal123 (Full Access)
- **Teachers (3):** teacher1/2/3@school.local / teacher123 (Academic Access)
- **Accountant:** accountant@school.local / accounts123 (Fee Management)
- **5 Sample Students** with Guardians (enrolled in various classes)

### ⚙️ Module Configuration
- **Enabled:** Education, Accounting, Setup
- **Hidden:** Manufacturing, Buying, Selling, Stock, HR, CRM, Projects, etc.
- Focused interface for school management only!

**📖 For complete details on sample users and demo data, see:** [SAMPLE_USERS_GUIDE.md](SAMPLE_USERS_GUIDE.md)

## Command Options

```bash
python3 ./easy-install.py deploy \
    --project=PROJECT_NAME \              # Unique project identifier
    --email=YOUR_EMAIL \                  # Administrator email & for SSL certificates
    --school-name="SCHOOL_NAME" \         # School/Administrator name (e.g., "St. Francis School")
    --image=ghcr.io/frappe/education \   # Docker image
    --version=latest \                    # Image version
    --app=education \                     # App to install
    --sitename=SITE_NAME \                # Your site domain
    --no-ssl \                            # (Optional) Disable HTTPS
    --http-port=8080 \                    # (Optional) Custom HTTP port
    --https-port=8443                     # (Optional) Custom HTTPS port (requires real domain)
```

### SSL on Custom Ports

**NEW!** You can now use SSL with custom ports:

```bash
python3 ./easy-install.py deploy \
    --project=school_main \
    --email=admin@yourschool.com \
    --sitename=school.yourdomain.com \
    --app=education \
    --http-port=8080 \
    --https-port=8443
```

**Requirements for SSL:**
- Real domain name pointing to your server
- Domain must be accessible from the internet
- Valid email address (for Let's Encrypt)

**For detailed SSL setup guide, see:** [SSL_CUSTOM_PORT_GUIDE.md](SSL_CUSTOM_PORT_GUIDE.md)

## Managing Your Deployment

### Configuration-Based Management (Recommended)

The `manage.sh` script uses configuration files for easier management. All data is stored in the project directory for portability.

#### Quick Setup

```bash
# 1. Create your configuration
cp .school.conf.example .school.conf
vim .school.conf  # Edit SCHOOL_CODE, BASE_PORT, and SITE_NAME

# 2. Show configuration info
./manage.sh info

# 3. Deploy and manage
./manage.sh install    # Creates everything with MariaDB 10.8
./manage.sh start      # Start services
./manage.sh status     # Check status
./manage.sh logs       # View logs
./manage.sh stop       # Stop services
./manage.sh shell      # Access backend shell
```

#### Key Features

- **MariaDB 10.8**: Fully compatible with Frappe Framework (no warnings!)
- **Automatic Database Permissions**: Handles container IP changes automatically
- **Custom Hostnames**: Easy setup with `set-hostname` command
- **Persistent Data**: All data stored locally in `./data/` directory

#### Multiple Schools

You can manage multiple schools using different config files:

```bash
# Create configs for different schools
cp .school.conf.example .school-main.conf
cp .school.conf.example .school-branch.conf

# Edit each with different SCHOOL_CODE and BASE_PORT
vim .school-main.conf    # SCHOOL_CODE="main", BASE_PORT=8080
vim .school-branch.conf  # SCHOOL_CODE="branch", BASE_PORT=8081

# Manage different schools
CONFIG_FILE=.school-main.conf ./manage.sh start
CONFIG_FILE=.school-branch.conf ./manage.sh start
```

#### Available Commands

**Basic Commands:**
```bash
./manage.sh info          # Show configuration and deployment info
./manage.sh install       # Deploy a new school instance
./manage.sh start         # Start the school instance
./manage.sh stop          # Stop the school instance
./manage.sh restart       # Restart the school instance
./manage.sh status        # Show detailed container status
./manage.sh logs          # Show and follow logs
./manage.sh shell         # Access backend shell
```

**Advanced Commands (NEW!):**
```bash
./manage.sh recreate      # Recreate containers (keeps data)
                         # Use after updating docker-compose.yml

./manage.sh rebuild       # Pull new images and rebuild (keeps data)
                         # Use to update ERPNext/Frappe versions

./manage.sh reset        # Complete fresh start (deletes everything)
                         # Requires typing 'DELETE' to confirm

./manage.sh set-hostname <hostname>  # Configure custom hostname
                                    # Example: ./manage.sh set-hostname internal3.paperentry.ai
```

#### Container Naming

Containers use the pattern: `USERNAME_SCHOOLCODE`
- Example: `santosh_main_school_backend`, `santosh_main_school_db`, etc.
- No more project listing needed - containers are found automatically!

#### File Organization

```
erpnext-school/
├── manage.sh                    # Management script
├── docker-compose.yml           # Docker configuration (MariaDB 10.8)
├── .school.conf                 # Your default config
├── .school-*.conf               # Additional school configs
└── data/                        # All project data
    ├── username_schoolcode.env              # Environment variables
    ├── username_schoolcode-credentials.txt  # Login credentials
    └── [Docker volumes managed automatically]
```

#### Custom Hostname Setup

To access your site via a custom domain:

```bash
# After installation
./manage.sh set-hostname internal3.paperentry.ai

# This automatically:
# 1. Updates site configuration
# 2. Creates hostname symlink
# 3. Restarts services
# 4. Makes site accessible at http://internal3.paperentry.ai:8080
```

### Direct Docker Commands (Alternative)

```bash
# Check Status
docker compose -p santosh-school_main ps

# View Logs
docker compose -p santosh-school_main logs -f backend

# Stop Services
docker compose -p santosh-school_main stop

# Start Services
docker compose -p santosh-school_main start

# Restart Services
docker compose -p santosh-school_main restart

# Access Backend Shell
python3 ./easy-install.py exec --project=school_main
```

## Upgrade

To upgrade to a newer version:

```bash
python3 ./easy-install.py upgrade \
    --project=my_school \
    --version=v15
```

## Backup & Restore

### Manual Backup
```bash
docker compose -p my_school exec backend \
    bench --site school.yourdomain.com backup
```

Backups are stored in the container and sync automatically every 6 hours.

### Restore Backup
```bash
docker compose -p my_school exec backend \
    bench --site school.yourdomain.com restore /path/to/backup.sql.gz
```

## Multiple Schools

You can run multiple independent school instances:

```bash
# School 1
python3 ./easy-install.py deploy \
    --project=school_abc \
    --sitename=abc.school.com \
    --email=admin@abc.com \
    --app=education

# School 2
python3 ./easy-install.py deploy \
    --project=school_xyz \
    --sitename=xyz.school.com \
    --email=admin@xyz.com \
    --app=education
```

Each project gets its own:
- Docker containers
- Database
- Configuration files
- Password file (`~/project_name-passwords.txt`)

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

## Manual Setup (Advanced)

If you want to customize the academic setup, you can use the included `setup_school_data.py` script to generate a custom setup:

```bash
python3 setup_school_data.py > custom_setup.py
# Edit custom_setup.py to your needs
# Then run it in the container
```

## File Structure

```
erpnext-school/
├── easy-install.py          # Main installation script
├── manage.sh                # Easy management script (start/stop/logs)
├── setup_school_data.py     # Helper for custom setups
├── README.md                # This file
└── frappe_docker/           # Auto-downloaded on first run
```

Your deployment files are stored in `~/`:
```
~/santosh-school_main-compose.yml   # Docker Compose configuration
~/santosh-school_main.env           # Environment variables
~/santosh-school_main-passwords.txt # Login credentials
```

**Note:** Project names are automatically prefixed with your username (e.g., `santosh-school_main`)

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
