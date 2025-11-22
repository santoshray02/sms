# School Management System (SMS)

A modern, lightweight school management system built for simplicity and ease of use.

## 🎯 Core Features

- **Student Management** - Enrollment, profiles, class assignments
- **Smart Batch Management** 🆕 - Automatic section assignment (A, B, C...) with alphabetical or merit-based strategies
- **Fee Management** - Automated monthly fee generation (Tuition + Hostel + Transport)
- **Payment Tracking** - Record payments, generate receipts
- **SMS Notifications** - Automated fee alerts and reminders to parents
- **Performance Tracking** 🆕 - Track student marks and attendance for AI-ready analytics
- **Reports** - Fee collections, defaulters, student lists

## 🏗️ Architecture

```
┌─────────────────┐
│   React UI      │  ← Modern, mobile-responsive admin panel
│  (TypeScript)   │
└────────┬────────┘
         │
┌────────▼────────┐
│  FastAPI        │  ← REST API
│  (Python 3.11)  │
└────────┬────────┘
         │
┌────────▼────────┐
│  PostgreSQL     │  ← Database
│     (15+)       │
└─────────────────┘
```

## 📁 Project Structure

```
school-management/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── utils/       # Helpers
│   ├── tests/
│   └── requirements.txt
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API calls
│   │   ├── hooks/       # Custom hooks
│   │   └── utils/       # Helpers
│   └── package.json
│
├── docker-compose.yml   # Development environment
├── docs/               # Documentation
└── scripts/            # Utility scripts
```

## 🚀 Quick Start

### Three Simple Commands
```bash
./manage.sh install    # First time setup (creates .env, pulls images)
./manage.sh start      # Start all services (PostgreSQL + Backend + Frontend)
```

That's it! Access at:
- **Frontend UI:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Default Login:** `admin` / `admin123`

### Management Commands
```bash
./manage.sh status     # Check if services are running
./manage.sh logs       # View all logs (Ctrl+C to exit)
./manage.sh stop       # Stop all services
./manage.sh restart    # Restart services
./manage.sh backup     # Backup database
./manage.sh help       # See all available commands
```

### All Available Commands
```
install          - Install and setup the system
configure        - Edit configuration (.env file)
start            - Start all services
stop             - Stop all services
restart          - Restart all services
status           - Show service status
logs [service]   - Show logs (optional: backend, frontend, db)

init-db          - Initialize database with sample data
backup           - Create database backup
restore <file>   - Restore database from backup
migrate          - Run database migrations

shell [service]  - Access shell (backend, frontend, db)
update           - Update system to latest version
clean            - Remove all data and containers
```

### Examples
```bash
./manage.sh install                  # First time setup
./manage.sh start                    # Start everything
./manage.sh logs backend             # View backend logs only
./manage.sh backup                   # Create database backup
./manage.sh shell db                 # Access PostgreSQL shell
./manage.sh restore backup.sql.gz    # Restore from backup
```

See [docs/DOCKER_GUIDE.md](docs/DOCKER_GUIDE.md) for detailed Docker documentation.

### Manual Setup (Without Docker)
<details>
<summary>Click to expand manual setup instructions</summary>

```bash
# 1. Install PostgreSQL 15+
sudo apt install postgresql-15

# 2. Create database
sudo -u postgres psql
CREATE DATABASE school_management;
CREATE USER school_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE school_management TO school_admin;

# 3. Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Configure environment
export DATABASE_URL="postgresql+asyncpg://school_admin:your_password@localhost/school_management"
export JWT_SECRET="your-secret-key"

# 5. Initialize database
python scripts/init_db.py

# 6. Start backend
uvicorn app.main:app --reload

# 7. Setup frontend (optional)
cd frontend
npm install
npm run dev
```
</details>

## 📊 Database Schema

See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

## 🛣️ Development Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md)

## 👥 User Roles

- **Admin/Director** - Full system access
- **Accountant** - Fee management, payments, reports

## 🔧 Technology Stack

- **Backend:** FastAPI, SQLAlchemy, Alembic
- **Frontend:** React 18, TypeScript, Tailwind CSS, Shadcn/ui
- **Database:** PostgreSQL 15
- **SMS:** MSG91/Twilio integration
- **Deploy:** Docker, Docker Compose

## 📝 License

Private - Internal Use Only
