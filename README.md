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

## 🚀 Quick Start

```bash
# Development
docker-compose up

# Access
Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
```

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
