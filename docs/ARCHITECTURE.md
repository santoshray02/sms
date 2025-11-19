# System Architecture

## Overview

Simple 3-tier architecture optimized for ease of use and maintenance by a small team (2 users).

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Admin Portal   │  │ Accountant UI   │                   │
│  │  (React SPA)    │  │  (React SPA)    │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                     │                            │
│           └─────────┬───────────┘                            │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      │ HTTPS (REST API)
                      │
┌─────────────────────▼────────────────────────────────────────┐
│                    Application Layer                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              FastAPI Application                      │   │
│  │                                                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │ Auth       │  │ Students   │  │ Fees       │     │   │
│  │  │ Service    │  │ Service    │  │ Service    │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  │                                                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │ Payments   │  │ SMS        │  │ Reports    │     │   │
│  │  │ Service    │  │ Service    │  │ Service    │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Background Task Scheduler                   │   │
│  │         (APScheduler - Monthly Fee Gen)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ SQL
                      │
┌─────────────────────▼────────────────────────────────────────┐
│                      Data Layer                              │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            PostgreSQL Database                        │   │
│  │         (Students, Fees, Payments, SMS Logs)          │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│                                                               │
│  ┌────────────────┐           ┌────────────────┐            │
│  │   MSG91/Twilio │           │  Email Service │            │
│  │   (SMS Gateway)│           │   (Optional)   │            │
│  └────────────────┘           └────────────────┘            │
└───────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Client Layer (Frontend)

**Technology:** React 18 + TypeScript + Tailwind CSS

**Key Features:**
- Single-page application (SPA)
- Role-based UI rendering (Admin vs Accountant)
- Responsive design (desktop + mobile)
- Offline-first approach (local state caching)

**Pages:**
- `/login` - Authentication
- `/dashboard` - Collection summary, pending fees
- `/students` - Student list, search, enrollment
- `/students/:id` - Student profile, fee history
- `/fees` - Fee generation, structures
- `/payments` - Record payments, generate receipts
- `/reports` - Collections, defaulters, SMS logs
- `/settings` - System configuration

**State Management:**
```
React Context
├── AuthContext (user, role, token)
├── AppContext (academic year, settings)
└── NotificationContext (toasts, alerts)
```

### 2. Application Layer (Backend)

**Technology:** FastAPI + SQLAlchemy + Pydantic

**API Structure:**
```
/api/v1
├── /auth
│   ├── POST /login
│   ├── POST /logout
│   └── GET /me
├── /students
│   ├── GET / (list with filters)
│   ├── POST / (create)
│   ├── GET /{id}
│   ├── PUT /{id}
│   ├── DELETE /{id}
│   └── POST /bulk-import (CSV)
├── /classes
│   ├── GET /
│   ├── POST /
│   └── GET /{id}/students
├── /fees
│   ├── GET /structures
│   ├── POST /structures
│   ├── POST /generate-monthly (trigger)
│   ├── GET /monthly (list with filters)
│   └── GET /monthly/{id}
├── /payments
│   ├── POST / (record payment)
│   ├── GET / (list)
│   ├── GET /{id}
│   └── GET /{id}/receipt (PDF)
├── /reports
│   ├── GET /collections
│   ├── GET /defaulters
│   ├── GET /class-wise
│   └── GET /sms-logs
├── /sms
│   ├── POST /send (manual)
│   └── GET /logs
└── /settings
    ├── GET /
    └── PUT /
```

**Service Layer Architecture:**

```python
# app/services/fee_service.py
class FeeService:
    def generate_monthly_fees(self, academic_year_id: int, month: int, year: int):
        """
        1. Get all active students
        2. Get fee structures by class
        3. Calculate total fees (tuition + hostel + transport)
        4. Create monthly_fee records
        5. Trigger SMS notifications
        """

    def calculate_student_fee(self, student: Student, fee_structure: FeeStructure):
        """Calculate total fee for a student based on their configuration"""

# app/services/sms_service.py
class SMSService:
    def send_fee_notification(self, monthly_fee: MonthlyFee):
        """Send fee generated notification"""

    def send_reminder(self, monthly_fee: MonthlyFee):
        """Send payment reminder"""

    def log_sms(self, phone: str, message: str, status: str):
        """Track SMS in database"""
```

**Background Tasks:**

```python
# app/tasks/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

# Generate fees on last day of month at 9 AM
@scheduler.scheduled_job('cron', day='last', hour=9)
async def generate_monthly_fees():
    """Auto-generate fees for all active students"""
    await fee_service.generate_monthly_fees(...)

# Send reminders 3 days before due date at 10 AM
@scheduler.scheduled_job('cron', hour=10)
async def send_reminders():
    """Send reminders for pending fees"""
    await sms_service.send_reminders(...)
```

### 3. Data Layer

**Technology:** PostgreSQL 15+

**Key Design Principles:**
- Normalized schema (3NF)
- Foreign key constraints
- Strategic indexes on search/filter fields
- Soft deletes via status flags
- Audit trails (created_at, updated_at)

**Critical Indexes:**
```sql
-- Performance-critical indexes
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_phone ON students(parent_phone);
CREATE INDEX idx_monthly_fees_status ON monthly_fees(status);
CREATE INDEX idx_monthly_fees_due_date ON monthly_fees(due_date);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

**Data Relationships:**
```
students (1) ──── (N) monthly_fees (1) ──── (N) payments
    │                      │
    │                      │
    └──── (N) classes      └──── (1) academic_years
    └──── (N) transport_routes
```

## Security Architecture

### Authentication Flow

```
1. User submits credentials
   ↓
2. Backend validates against users table
   ↓
3. Generate JWT token (24h expiry)
   ↓
4. Return token + user info
   ↓
5. Frontend stores in memory (not localStorage for security)
   ↓
6. All API calls include: Authorization: Bearer <token>
   ↓
7. Backend validates token on each request
```

### Security Measures

**Backend:**
- Password hashing with bcrypt (cost factor: 12)
- JWT tokens with short expiry (24 hours)
- SQL injection prevention (SQLAlchemy parameterized queries)
- Input validation with Pydantic schemas
- CORS configuration (whitelist only frontend domain)
- Rate limiting on authentication endpoints
- HTTPS only in production

**Frontend:**
- XSS prevention (React auto-escaping)
- CSRF protection for state-changing operations
- Secure token storage (memory only, refresh on reload)
- Role-based component rendering
- Input sanitization

**Database:**
- Encrypted connections (SSL/TLS)
- Least privilege principle (app user has limited permissions)
- Regular backups
- No direct database access from internet

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15
    ports: 5432:5432
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports: 8000:8000
    depends_on: [db]
    environment:
      - DATABASE_URL=postgresql://...
      - JWT_SECRET=...

  frontend:
    build: ./frontend
    ports: 3000:3000
    depends_on: [backend]
```

### Production Environment

```
Internet
    │
    ▼
┌───────────────┐
│  Nginx        │  (Reverse Proxy + SSL)
│  Port 443     │
└───────┬───────┘
        │
        ├─────► /api/v1/*  → Backend (Gunicorn + Uvicorn)
        │                     Port 8000 (internal)
        │
        └─────► /*          → Frontend (Nginx serving static)
                              Port 3000 (internal)
```

**Server Requirements:**
- **Minimum:** 2 CPU, 4GB RAM, 50GB SSD
- **Recommended:** 4 CPU, 8GB RAM, 100GB SSD

**Scaling Considerations:**
- Current design: 1000+ students easily
- For 5000+ students: Add Redis caching layer
- For 10000+ students: Horizontal scaling with load balancer

## Data Flow Examples

### Example 1: Monthly Fee Generation

```
1. Scheduler triggers at month-end
   ↓
2. FeeService.generate_monthly_fees()
   ↓
3. Query all active students
   ↓
4. For each student:
   a. Get fee_structure for their class
   b. Calculate: tuition + (hostel if has_hostel) + (transport if transport_route_id)
   c. Create monthly_fee record
   d. Queue SMS notification
   ↓
5. SMSService processes queue
   ↓
6. Send SMS via MSG91/Twilio
   ↓
7. Log SMS status in sms_logs table
   ↓
8. Update monthly_fee.sms_sent = true
```

### Example 2: Payment Recording

```
1. Accountant opens student profile
   ↓
2. Frontend fetches pending fees: GET /api/v1/fees/monthly?student_id=123&status=pending
   ↓
3. Accountant selects fee record, enters payment details
   ↓
4. Frontend: POST /api/v1/payments
   {
     monthly_fee_id: 456,
     amount: 5000,
     payment_mode: "cash",
     payment_date: "2024-01-15"
   }
   ↓
5. Backend PaymentService:
   a. Create payment record
   b. Update monthly_fee.amount_paid += 5000
   c. Calculate amount_pending = total_fee - amount_paid
   d. Update status: "paid" | "partial"
   e. Generate receipt_number
   ↓
6. Return receipt data
   ↓
7. Frontend displays receipt (printable)
```

## Error Handling

### Backend Error Responses

```json
{
  "error": "ValidationError",
  "message": "Admission number already exists",
  "details": {
    "field": "admission_number",
    "value": "2024-001"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Categories:**
- `ValidationError` (400) - Invalid input
- `AuthenticationError` (401) - Invalid credentials
- `AuthorizationError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Duplicate entry
- `ServerError` (500) - Internal error

### Frontend Error Handling

```typescript
try {
  await studentService.create(data);
  showSuccessToast("Student enrolled successfully");
} catch (error) {
  if (error.status === 409) {
    showErrorToast("Admission number already exists");
  } else {
    showErrorToast("Failed to enroll student. Please try again.");
    logError(error); // Send to monitoring
  }
}
```

## Monitoring & Logging

### Application Logs

```python
# Structured logging with context
logger.info(
    "Fee generated",
    extra={
        "student_id": student.id,
        "amount": total_fee,
        "month": month,
        "year": year
    }
)
```

### Key Metrics to Track

1. **Business Metrics:**
   - Total fees generated per month
   - Collection percentage
   - SMS delivery rate
   - Payment methods breakdown

2. **Technical Metrics:**
   - API response times
   - Database query performance
   - Error rates
   - SMS gateway success rate

3. **Operational:**
   - Active student count
   - Fee generation job success
   - Database backup status

## Backup & Recovery

### Database Backup Strategy

```bash
# Automated daily backup (cron job)
0 2 * * * pg_dump -U postgres school_db > /backups/school_db_$(date +\%Y\%m\%d).sql

# Retention:
# - Daily backups: 7 days
# - Weekly backups: 4 weeks
# - Monthly backups: 12 months
```

### Disaster Recovery

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 24 hours (daily backups)

**Recovery Steps:**
1. Restore latest database backup
2. Redeploy application containers
3. Verify data integrity
4. Resume operations

## Performance Optimization

### Database Optimization
- Connection pooling (SQLAlchemy pool size: 20)
- Query optimization (avoid N+1, use joins)
- Pagination (limit 50 records per page)
- Indexes on all foreign keys

### API Optimization
- Response compression (gzip)
- Caching headers for static data
- Async endpoints for I/O operations
- Background tasks for heavy operations

### Frontend Optimization
- Code splitting (lazy load routes)
- Image optimization
- API response caching (React Query)
- Debounced search inputs

## Technology Justification

### Why FastAPI?
- Fast performance (async support)
- Auto-generated API documentation
- Type safety with Pydantic
- Easy to learn and maintain

### Why React?
- Component reusability
- Large ecosystem (libraries, tools)
- TypeScript support for type safety
- Excellent mobile responsiveness

### Why PostgreSQL?
- Robust ACID compliance
- Excellent for relational data
- JSON support for flexible fields
- Proven reliability

### Why Not ERPNext/Frappe?
- Too complex for 2-user scenario
- High learning curve
- Overkill for simple use case
- Hard to customize for non-developers

## Summary

This architecture prioritizes:
1. **Simplicity** - Easy to understand and maintain
2. **Reliability** - Automated backups, error handling
3. **Performance** - Optimized queries, caching, indexes
4. **Security** - Authentication, input validation, HTTPS
5. **Scalability** - Can grow from 100 to 5000+ students

Perfect fit for a school with 2 technical users managing student fees and payments.
