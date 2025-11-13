# ERPNext School Management System

A configuration-based deployment and management system for ERPNext Education instances. Designed for easy setup, portability, and managing multiple school deployments.

## Features

- **Configuration-Based**: All settings in `.school.conf` files
- **Portable**: All data stored within the project directory
- **Multiple Schools**: Manage multiple school instances with different configs
- **Easy Management**: Simple CLI commands for start/stop/status
- **Auto Setup**: Includes sample data, users, and fee structures

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/erpnext-school.git
cd erpnext-school
```

### 2. Create Configuration

```bash
cp .school.conf.example .school.conf
vim .school.conf
```

Edit these required fields:
- `SCHOOL_CODE`: Unique identifier (e.g., "main_school")
- `BASE_PORT`: HTTP port (e.g., 8080)

### 3. Deploy

```bash
# Using easy-install.py (creates new deployment)
python3 easy-install.py deploy \
    --project=your_school \
    --email=admin@yourschool.com \
    --school-name="Your School Name" \
    --app=education \
    --sitename=school.yourdomain.com

# Or use manage.sh to control existing deployments
./manage.sh info
./manage.sh start
```

## Management Commands

```bash
./manage.sh info          # Show configuration and status
./manage.sh start         # Start the school instance
./manage.sh stop          # Stop the school instance
./manage.sh restart       # Restart containers
./manage.sh status        # Show detailed container status
./manage.sh logs          # View and follow logs
./manage.sh shell         # Access backend shell
```

## Multiple Schools

Manage multiple school instances with separate config files:

```bash
# Create configs
cp .school.conf.example .school-main.conf
cp .school.conf.example .school-branch.conf

# Edit with different SCHOOL_CODE and ports
vim .school-main.conf     # SCHOOL_CODE="main", BASE_PORT=8080
vim .school-branch.conf   # SCHOOL_CODE="branch", BASE_PORT=8081

# Start specific schools
CONFIG_FILE=.school-main.conf ./manage.sh start
CONFIG_FILE=.school-branch.conf ./manage.sh start
```

## Project Structure

```
erpnext-school/
├── .school.conf.example     # Configuration template
├── manage.sh                # Management script
├── easy-install.py          # Installation script
├── deployments/             # Docker compose files (not in git)
├── data/                    # Credentials & data (not in git)
└── backups/                 # Backups (not in git)
```

## Configuration Options

See [.school.conf.example](.school.conf.example) for all available options:

### Required
- `SCHOOL_CODE`: Unique school identifier
- `BASE_PORT`: HTTP port for access

### Optional
- `HTTPS_PORT`: HTTPS port
- `ERPNEXT_VERSION`: Version to deploy
- `SITE_NAME`: Site domain name
- Payment gateway, SMS, email settings
- Resource limits (memory, CPU)
- Storage and backup paths

## Container Naming

Containers use the pattern: `USERNAME_SCHOOLCODE`

Example: `santosh_main_school_backend`, `santosh_main_school_db`

## What Gets Auto-Created

When deploying with the education app:

### Academic Data
- 20 Programs (Playgroup to Class 12 with streams)
- 2 Academic Terms
- 12 Fee Categories

### Sample Users
- Principal (full access)
- 3 Teachers
- 1 Accountant
- 5 Sample Students with Guardians

See [SAMPLE_USERS_GUIDE.md](SAMPLE_USERS_GUIDE.md) for details.

## Documentation

- [Main README](README.md) - Complete documentation
- [Sample Users Guide](SAMPLE_USERS_GUIDE.md) - Login credentials and demo data
- [SSL Setup Guide](SSL_CUSTOM_PORT_GUIDE.md) - HTTPS configuration
- [Student Import Guide](STUDENT_IMPORT_GUIDE.md) - Bulk student import

## Requirements

### Minimum
- 2GB RAM
- 2 CPU cores
- 20GB disk space
- Docker & Docker Compose
- Python 3.6+

### Recommended
- 4GB RAM
- 4 CPU cores
- 50GB disk space
- SSD storage

## Security Notes

⚠️ **Important**: Never commit these files to public repositories:
- `.school.conf` (contains your configuration)
- `deployments/` directory (contains compose files and env vars)
- `data/` directory (contains credentials)
- Any `*-passwords.txt` or `*-credentials.txt` files

The `.gitignore` is configured to exclude these automatically.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

GNU General Public License v3.0

## Support

- [ERPNext Documentation](https://docs.erpnext.com)
- [Frappe Forum](https://discuss.erpnext.com)
- [GitHub Issues](https://github.com/yourusername/erpnext-school/issues)

## Acknowledgments

- Built on [Frappe Framework](https://frappeframework.com/)
- Uses [ERPNext Education](https://github.com/frappe/education)
- Docker setup from [frappe_docker](https://github.com/frappe/frappe_docker)
