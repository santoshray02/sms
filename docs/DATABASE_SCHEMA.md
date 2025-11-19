# Database Schema

## Overview

Simple, normalized schema focused on core school operations.

## Tables

### 1. students
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    admission_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,

    -- Class assignment
    class_id INTEGER NOT NULL REFERENCES classes(id),
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),

    -- Parent/Guardian info
    parent_name VARCHAR(200) NOT NULL,
    parent_phone VARCHAR(15) NOT NULL,
    parent_email VARCHAR(255),
    address TEXT,

    -- Fee configuration
    has_hostel BOOLEAN DEFAULT FALSE,
    transport_route_id INTEGER REFERENCES transport_routes(id),

    -- Metadata
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, graduated
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_phone ON students(parent_phone);
CREATE INDEX idx_students_status ON students(status);
```

### 2. classes
```sql
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- "Class 1", "Class 2", etc.
    section VARCHAR(10), -- "A", "B", etc.
    display_order INTEGER,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data: Playgroup, Nursery, LKG, UKG, Class 1-12
```

### 3. academic_years
```sql
CREATE TABLE academic_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE, -- "2024-25"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. fee_structures
```sql
CREATE TABLE fee_structures (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),

    -- Fee components (monthly)
    tuition_fee DECIMAL(10,2) NOT NULL,
    hostel_fee DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(class_id, academic_year_id)
);
```

### 5. transport_routes
```sql
CREATE TABLE transport_routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- "Route 1 (0-5 km)"
    distance_km INTEGER,
    monthly_fee DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. monthly_fees
```sql
CREATE TABLE monthly_fees (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
    month INTEGER NOT NULL, -- 1-12
    year INTEGER NOT NULL,

    -- Fee breakdown
    tuition_fee DECIMAL(10,2) NOT NULL,
    hostel_fee DECIMAL(10,2) DEFAULT 0,
    transport_fee DECIMAL(10,2) DEFAULT 0,
    total_fee DECIMAL(10,2) NOT NULL,

    -- Payment status
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_pending DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, partial

    -- Dates
    due_date DATE NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),

    -- SMS tracking
    sms_sent BOOLEAN DEFAULT FALSE,
    sms_sent_at TIMESTAMP,
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,

    UNIQUE(student_id, academic_year_id, month, year)
);

CREATE INDEX idx_monthly_fees_student ON monthly_fees(student_id);
CREATE INDEX idx_monthly_fees_status ON monthly_fees(status);
CREATE INDEX idx_monthly_fees_due_date ON monthly_fees(due_date);
```

### 7. payments
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    monthly_fee_id INTEGER NOT NULL REFERENCES monthly_fees(id),
    student_id INTEGER NOT NULL REFERENCES students(id),

    amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL, -- cash, upi, cheque, card
    payment_date DATE NOT NULL,
    transaction_id VARCHAR(100),

    receipt_number VARCHAR(50) UNIQUE NOT NULL,

    notes TEXT,
    recorded_by INTEGER NOT NULL REFERENCES users(id),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_receipt ON payments(receipt_number);
```

### 8. sms_logs
```sql
CREATE TABLE sms_logs (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    message TEXT NOT NULL,
    sms_type VARCHAR(20) NOT NULL, -- fee_generated, reminder, custom

    student_id INTEGER REFERENCES students(id),
    monthly_fee_id INTEGER REFERENCES monthly_fees(id),

    status VARCHAR(20) NOT NULL, -- sent, failed, pending
    gateway_response TEXT,

    sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sms_logs_phone ON sms_logs(phone_number);
CREATE INDEX idx_sms_logs_type ON sms_logs(sms_type);
```

### 9. users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL, -- admin, accountant

    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 10. system_settings
```sql
CREATE TABLE system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Settings like: sms_gateway, fee_due_day, reminder_days, etc.
```

## Relationships

```
students ──┬─→ classes
           ├─→ academic_years
           ├─→ transport_routes (optional)
           └─→ monthly_fees ──→ payments

fee_structures ──┬─→ classes
                 └─→ academic_years

users ──→ payments (recorded_by)
```

## Key Design Decisions

1. **Monthly fees are pre-generated** - System generates fee records at month-end
2. **Flexible fee structure** - Hostel and transport are optional per student
3. **Payment history** - Multiple payments can be made against one monthly fee
4. **SMS tracking** - Track all SMS sent with status
5. **Soft deletes** - Use status flags instead of deleting records

## Indexes

Strategic indexes on:
- Foreign keys
- Search fields (phone, admission_number)
- Filter fields (status, date ranges)

## Sample Data Flow

1. **Student Enrollment**
   - Create student record
   - Assign class, academic year
   - Configure hostel/transport

2. **Monthly Fee Generation** (automated)
   - System generates monthly_fees for all active students
   - Calculates total based on student configuration
   - Sets due date
   - Sends SMS notification

3. **Payment Recording**
   - Accountant records payment
   - Updates monthly_fees.amount_paid
   - Generates receipt
   - Updates status (paid/partial)

4. **Reminders** (automated)
   - System checks pending fees near due date
   - Sends reminder SMS
   - Tracks in sms_logs
