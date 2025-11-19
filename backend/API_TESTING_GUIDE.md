# API Testing Guide

Quick guide to test all API endpoints using the FastAPI docs interface or curl.

## Setup

1. Start the backend server:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

2. Initialize database with sample data:
```bash
python scripts/init_db.py
```

3. Open API docs:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Authentication

### 1. Login as Admin

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

Save this token for subsequent requests!

### 2. Get Current User

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Student Management

### 3. List Students

```bash
curl "http://localhost:8000/api/v1/students?page=1&page_size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Create Student

```bash
curl -X POST http://localhost:8000/api/v1/students \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "admission_number": "2024004",
    "first_name": "Neha",
    "last_name": "Gupta",
    "date_of_birth": "2014-06-15",
    "gender": "Female",
    "class_id": 6,
    "academic_year_id": 1,
    "parent_name": "Rakesh Gupta",
    "parent_phone": "+919876543213",
    "parent_email": "rakesh@email.com",
    "has_hostel": false,
    "transport_route_id": 1
  }'
```

### 5. Search Students

```bash
curl "http://localhost:8000/api/v1/students?search=Raj" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Academic Setup

### 6. List Classes

```bash
curl http://localhost:8000/api/v1/academic/classes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. List Academic Years

```bash
curl http://localhost:8000/api/v1/academic/academic-years \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8. List Transport Routes

```bash
curl http://localhost:8000/api/v1/academic/transport-routes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Fee Management

### 9. Create Fee Structure

```bash
curl -X POST http://localhost:8000/api/v1/fees/structures \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": 7,
    "academic_year_id": 1,
    "tuition_fee": 3000.00,
    "hostel_fee": 2000.00
  }'
```

### 10. List Fee Structures

```bash
curl http://localhost:8000/api/v1/fees/structures \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 11. Generate Monthly Fees

```bash
curl -X POST http://localhost:8000/api/v1/fees/generate-monthly \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academic_year_id": 1,
    "month": 1,
    "year": 2025,
    "due_day": 10
  }'
```

### 12. List Monthly Fees

```bash
curl "http://localhost:8000/api/v1/fees/monthly?academic_year_id=1&month=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 13. Get Pending Fees for a Student

```bash
curl "http://localhost:8000/api/v1/fees/monthly?student_id=1&status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Payment Recording

### 14. Record Payment

```bash
curl -X POST http://localhost:8000/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monthly_fee_id": 1,
    "student_id": 1,
    "amount": 2500.00,
    "payment_mode": "cash",
    "payment_date": "2025-01-19",
    "notes": "Full payment for January"
  }'
```

**Response includes receipt_number:**
```json
{
  "id": 1,
  "receipt_number": "RCP-20250119-00001",
  "amount": 2500.00,
  ...
}
```

### 15. List Payments

```bash
curl http://localhost:8000/api/v1/payments?page=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 16. Get Payment by ID

```bash
curl http://localhost:8000/api/v1/payments/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Reports

### 17. Collection Summary

```bash
curl "http://localhost:8000/api/v1/reports/collections?academic_year_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sample Response:**
```json
{
  "total_fees": 15000.00,
  "total_collected": 10000.00,
  "total_pending": 5000.00,
  "collection_percentage": 66.67,
  "total_students": 3,
  "paid_count": 1,
  "partial_count": 1,
  "pending_count": 1
}
```

### 18. Defaulters List

```bash
curl "http://localhost:8000/api/v1/reports/defaulters?academic_year_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 19. Class-wise Collection

```bash
curl "http://localhost:8000/api/v1/reports/class-wise?academic_year_id=1&month=1&year=2025" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 20. Payment Mode Breakdown

```bash
curl "http://localhost:8000/api/v1/reports/payment-modes?academic_year_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 21. SMS Logs

```bash
curl "http://localhost:8000/api/v1/reports/sms-logs?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing Workflow

### Complete Fee Management Flow

1. **Setup** (Run init_db.py script)
   - Creates users, classes, academic year, transport routes
   - Creates fee structures
   - Creates 3 sample students

2. **Generate Monthly Fees**
   ```bash
   POST /api/v1/fees/generate-monthly
   ```
   - Generates fees for all active students
   - Calculates tuition + hostel + transport
   - Sets due date

3. **View Generated Fees**
   ```bash
   GET /api/v1/fees/monthly?academic_year_id=1&month=1&year=2025
   ```

4. **Record Payment**
   ```bash
   POST /api/v1/payments
   ```
   - Creates payment record
   - Generates receipt number
   - Updates monthly fee status

5. **View Reports**
   ```bash
   GET /api/v1/reports/collections
   GET /api/v1/reports/defaulters
   GET /api/v1/reports/class-wise
   ```

## Using FastAPI Docs (Recommended)

1. Visit http://localhost:8000/docs
2. Click **Authorize** button
3. Login to get token: POST /api/v1/auth/login
4. Copy the `access_token` from response
5. Paste in Authorization dialog: `Bearer YOUR_TOKEN`
6. Click **Authorize**
7. Now you can test any endpoint with the "Try it out" button!

## Common Scenarios

### Scenario 1: Enroll New Student
1. List classes to get class_id
2. List academic years to get academic_year_id
3. POST /api/v1/students with student data

### Scenario 2: Generate Fees for New Month
1. POST /api/v1/fees/generate-monthly with month/year
2. Check SMS logs to verify notifications sent
3. GET /api/v1/fees/monthly to view generated fees

### Scenario 3: Record Payment
1. GET /api/v1/fees/monthly?student_id=X&status=pending
2. Note the monthly_fee_id from response
3. POST /api/v1/payments with fee_id and amount
4. Receipt number is auto-generated

### Scenario 4: View Defaulters
1. GET /api/v1/reports/defaulters
2. Shows students with pending fees past due date
3. Includes overdue days calculation

## Error Handling

All endpoints return proper HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

Error response format:
```json
{
  "detail": "Error message here"
}
```

## Tips

1. **Use Swagger UI** for interactive testing (http://localhost:8000/docs)
2. **Token expires in 24 hours** - login again if you get 401 errors
3. **Amounts are in rupees** for API input/output (stored as paise internally)
4. **Phone numbers** should be in E.164 format (+91XXXXXXXXXX)
5. **Admission numbers** must be unique
6. **Admin role required** for creating classes, fee structures, generating fees
7. **Accountant and Admin** can both record payments and view reports

## Next Steps

After testing the API:
1. Build the React frontend
2. Integrate with these endpoints
3. Create user-friendly forms
4. Add data visualization for reports
5. Implement PDF receipt generation
6. Add CSV export for reports

Happy Testing! 🚀
