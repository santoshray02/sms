# School Management System - Backend

FastAPI backend with async SQLAlchemy and PostgreSQL.

## Quick Start

### Using Docker

```bash
# From project root
docker-compose up backend db
```

### Local Development

```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Create database (ensure PostgreSQL is running)
createdb school_management

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── dependencies.py      # Auth dependencies
│   │   └── v1/
│   │       ├── endpoints/       # API endpoints
│   │       │   └── auth.py     # Authentication endpoints
│   │       └── router.py        # Main API router
│   ├── core/
│   │   ├── config.py           # Settings
│   │   └── security.py         # Password hashing, JWT
│   ├── db/
│   │   └── session.py          # Database connection
│   ├── models/                 # SQLAlchemy models
│   │   ├── user.py
│   │   ├── student.py
│   │   ├── academic.py
│   │   ├── fee.py
│   │   ├── payment.py
│   │   └── sms.py
│   ├── schemas/                # Pydantic schemas
│   │   ├── user.py
│   │   ├── student.py
│   │   ├── academic.py
│   │   ├── fee.py
│   │   └── payment.py
│   ├── services/               # Business logic (TBD)
│   ├── utils/                  # Helper functions (TBD)
│   └── main.py                 # FastAPI app
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
├── tests/                      # Tests (TBD)
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with username/password
- `POST /api/v1/auth/logout` - Logout (client discards token)
- `GET /api/v1/auth/me` - Get current user info

### Students (TBD)
- `GET /api/v1/students` - List students
- `POST /api/v1/students` - Create student
- `GET /api/v1/students/{id}` - Get student details
- `PUT /api/v1/students/{id}` - Update student
- `DELETE /api/v1/students/{id}` - Delete student
- `POST /api/v1/students/bulk-import` - CSV bulk import

### Classes (TBD)
- `GET /api/v1/classes` - List classes
- `POST /api/v1/classes` - Create class
- `GET /api/v1/classes/{id}` - Get class details

### Fees (TBD)
- `GET /api/v1/fees/structures` - List fee structures
- `POST /api/v1/fees/structures` - Create fee structure
- `POST /api/v1/fees/generate-monthly` - Generate monthly fees
- `GET /api/v1/fees/monthly` - List monthly fees

### Payments (TBD)
- `POST /api/v1/payments` - Record payment
- `GET /api/v1/payments` - List payments
- `GET /api/v1/payments/{id}/receipt` - Download receipt PDF

### Reports (TBD)
- `GET /api/v1/reports/collections` - Fee collection report
- `GET /api/v1/reports/defaulters` - Defaulter list
- `GET /api/v1/reports/class-wise` - Class-wise collection

### SMS (TBD)
- `POST /api/v1/sms/send` - Send manual SMS
- `GET /api/v1/sms/logs` - SMS logs

## Development

### Create Admin User

```python
# Start Python shell
python

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import asyncio

async def create_admin():
    async with AsyncSessionLocal() as db:
        admin = User(
            username="admin",
            email="admin@school.com",
            password_hash=get_password_hash("admin123"),
            full_name="System Administrator",
            role="admin",
            is_active=True
        )
        db.add(admin)
        await db.commit()
        print("Admin user created!")

asyncio.run(create_admin())
```

### Run Tests

```bash
pytest
```

### Code Quality

```bash
# Format code
black app/

# Lint
flake8 app/

# Type check
mypy app/
```

## Environment Variables

See [.env.example](.env.example) for all available settings:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_ALGORITHM` - JWT algorithm (default: HS256)
- `JWT_EXPIRATION_HOURS` - Token expiry time (default: 24)
- `SMS_GATEWAY` - SMS gateway (msg91 or twilio)
- `SMS_API_KEY` - SMS gateway API key
- `CORS_ORIGINS` - Allowed CORS origins

## Notes

- All monetary values are stored as integers (paise)
- 100 paise = 1 rupee
- API returns rupees (floats), database stores paise (integers)
- All dates are in UTC
- Phone numbers should be in E.164 format (+91XXXXXXXXXX)
