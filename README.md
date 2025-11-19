# School Management System (SMS)

A modern, lightweight school management system built for simplicity and ease of use.

## 🎯 Core Features

- **Student Management** - Enrollment, profiles, class assignments
- **Fee Management** - Automated monthly fee generation (Tuition + Hostel + Transport)
- **Payment Tracking** - Record payments, generate receipts
- **SMS Notifications** - Automated fee alerts and reminders to parents
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

## 🚀 Quick Start (Docker)

### Option 1: Automated Setup (Easiest)
```bash
# One command to set up and start everything!
./start.sh
```

### Option 2: Manual Setup
```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start all services (PostgreSQL + Backend + Frontend)
docker-compose up -d

# 3. Initialize database with sample data
docker-compose exec backend python scripts/init_db.py
```

### Access Application
- **Frontend UI:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Default Login:** `admin` / `admin123`

### Stop Services
```bash
# Option 1: Using stop script
./stop.sh

# Option 2: Using docker-compose
docker-compose down
```

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

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Reset everything (removes data)
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build

# Access database
docker-compose exec db psql -U school_admin -d school_management

# Run migrations
docker-compose exec backend alembic upgrade head

# Backup database
docker-compose exec db pg_dump -U school_admin school_management | gzip > backup.sql.gz
```

See [docs/DOCKER_GUIDE.md](docs/DOCKER_GUIDE.md) for complete Docker documentation.

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
