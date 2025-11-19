# Getting Started Guide

Complete guide to set up and run the School Management System.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (20.10+) & **Docker Compose** (2.0+)
- **Git**
- **Python** 3.11+ (for local development without Docker)
- **Node.js** 18+ and npm (for local frontend development)
- **PostgreSQL** 15+ (if running without Docker)

## Quick Start (Docker)

The fastest way to get started is using Docker Compose:

### 1. Clone and Navigate

```bash
cd /home/santosh/projects/experiments/erpnext-school
```

### 2. Configure Environment

```bash
# Copy environment example
cp backend/.env.example backend/.env

# Edit the .env file with your settings
nano backend/.env
```

**Important settings to change:**
- `JWT_SECRET` - Generate a secure random string
- `SMS_API_KEY` - Your MSG91 or Twilio API key
- `DATABASE_URL` - Update password if needed

### 3. Start All Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- FastAPI backend (port 8000)
- React frontend (port 3000)

### 4. Verify Installation

```bash
# Check if all containers are running
docker-compose ps

# Check backend health
curl http://localhost:8000/health

# Check backend API docs
open http://localhost:8000/docs

# Check frontend
open http://localhost:3000
```

### 5. Create Initial Admin User

```bash
# Access backend container
docker-compose exec backend python

# In Python shell:
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
exit()
```

### 6. Login

- Open http://localhost:3000
- Username: `admin`
- Password: `admin123`
- **Change password immediately!**

## Local Development (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database (ensure PostgreSQL is running)
createdb school_management

# Copy environment file
cp .env.example .env
nano .env  # Edit DATABASE_URL and other settings

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:8000/api/v1" > .env.local

# Start development server
npm start
```

Frontend will be available at http://localhost:3000

## Initial Data Setup

### 1. Create Academic Year

**API Request:**
```bash
curl -X POST http://localhost:8000/api/v1/academic-years \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2024-25",
    "start_date": "2024-04-01",
    "end_date": "2025-03-31",
    "is_current": true
  }'
```

### 2. Create Classes

```bash
# Playgroup to Class 12
for class in "Playgroup" "Nursery" "LKG" "UKG" "Class 1" "Class 2" "Class 3" "Class 4" "Class 5" "Class 6" "Class 7" "Class 8" "Class 9" "Class 10" "Class 11" "Class 12"; do
  curl -X POST http://localhost:8000/api/v1/classes \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$class\", \"section\": \"A\"}"
done
```

### 3. Create Transport Routes

```bash
curl -X POST http://localhost:8000/api/v1/transport-routes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Route 1 (0-5 km)",
    "distance_km": 5,
    "monthly_fee": 500.00
  }'
```

### 4. Create Fee Structures

```bash
# Example for Class 1
curl -X POST http://localhost:8000/api/v1/fee-structures \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": 5,
    "academic_year_id": 1,
    "tuition_fee": 3000.00,
    "hostel_fee": 2000.00
  }'
```

### 5. Import Students (CSV)

Create a CSV file with student data:

```csv
admission_number,first_name,last_name,date_of_birth,gender,class_name,parent_name,parent_phone,parent_email,has_hostel,transport_route_name
2024001,Raj,Kumar,2010-05-15,Male,Class 1,Suresh Kumar,9876543210,suresh@email.com,false,Route 1 (0-5 km)
2024002,Priya,Sharma,2010-08-22,Female,Class 1,Ramesh Sharma,9876543211,ramesh@email.com,true,
```

Import via API:
```bash
curl -X POST http://localhost:8000/api/v1/students/bulk-import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@students.csv"
```

## Common Tasks

### Generate Monthly Fees Manually

```bash
curl -X POST http://localhost:8000/api/v1/fees/generate-monthly \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academic_year_id": 1,
    "month": 1,
    "year": 2025
  }'
```

### Record a Payment

```bash
curl -X POST http://localhost:8000/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monthly_fee_id": 1,
    "student_id": 1,
    "amount": 5000.00,
    "payment_mode": "cash",
    "payment_date": "2025-01-15",
    "notes": "Full payment for January"
  }'
```

### View Defaulters Report

```bash
curl http://localhost:8000/api/v1/reports/defaulters?academic_year_id=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check SMS Logs

```bash
curl http://localhost:8000/api/v1/sms/logs?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## SMS Gateway Setup

### MSG91 Setup

1. Sign up at https://msg91.com/
2. Get your API key from dashboard
3. Create SMS template:
   - Template: "Your child's fee of Rs. {amount} for {month} is due on {due_date}. School Contact: {school_phone}"
   - Get template ID
4. Update `.env`:
   ```
   SMS_GATEWAY=msg91
   SMS_API_KEY=your_api_key_here
   SMS_SENDER_ID=SCHOOL
   ```

### Twilio Setup (Alternative)

1. Sign up at https://www.twilio.com/
2. Get Account SID and Auth Token
3. Update `.env`:
   ```
   SMS_GATEWAY=twilio
   SMS_API_KEY=your_auth_token
   SMS_SENDER_ID=+1234567890
   ```

## Troubleshooting

### Backend won't start

**Error:** `ModuleNotFoundError: No module named 'app'`
- **Solution:** Ensure you're in the backend directory and virtual environment is activated

**Error:** `sqlalchemy.exc.OperationalError: could not connect to server`
- **Solution:** Check PostgreSQL is running and DATABASE_URL is correct

### Frontend won't start

**Error:** `Cannot find module 'react'`
- **Solution:** Run `npm install` in frontend directory

**Error:** `EADDRINUSE: address already in use :::3000`
- **Solution:** Port 3000 is occupied. Kill process: `lsof -ti:3000 | xargs kill -9`

### Database connection issues

```bash
# Check PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs db

# Access PostgreSQL
docker-compose exec db psql -U school_admin -d school_management
```

### SMS not sending

1. Check SMS gateway credentials in `.env`
2. Check SMS logs: `GET /api/v1/sms/logs`
3. Verify phone numbers are in correct format (+91XXXXXXXXXX)
4. Check API quota/balance in MSG91/Twilio dashboard

## Development Workflow

### Making Changes

```bash
# Create feature branch
git checkout -b feature/student-bulk-upload

# Make changes...

# Test changes
cd backend
pytest

cd frontend
npm test

# Commit
git add .
git commit -m "Add bulk student upload feature"

# Push
git push origin feature/student-bulk-upload
```

### Database Migrations (Alembic)

```bash
cd backend

# Create migration after model changes
alembic revision --autogenerate -m "Add student notes field"

# Review migration file in alembic/versions/

# Apply migration
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

## Production Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment guide.

## Next Steps

1. **Customize fee structures** - Set fees for all classes
2. **Import all students** - Use CSV bulk import
3. **Configure SMS templates** - Customize notification messages
4. **Test fee generation** - Run manual generation before setting up scheduler
5. **Train users** - Admin and Accountant training on the UI

## Support

- **Documentation:** [docs/](docs/)
- **API Docs:** http://localhost:8000/docs (when running)
- **Issues:** Contact your system administrator

## Security Checklist

Before going to production:

- [ ] Change default admin password
- [ ] Generate strong JWT_SECRET
- [ ] Update all passwords in .env
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure firewall (allow only 443, 80)
- [ ] Set up database backups
- [ ] Disable DEBUG mode (DEBUG=False)
- [ ] Review CORS settings
- [ ] Set up monitoring and alerts

---

Happy coding! The system is now ready for development.
