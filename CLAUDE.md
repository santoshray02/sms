# School Management System - Claude Code Guide

## Project Overview

**Type:** School fee management system for rural Bihar CBSE school
**Stack:** FastAPI + React + PostgreSQL + Docker
**Scale:** 100-5000 students, 2 users (Admin + Accountant)
**Key Feature:** Smart batch management with automatic section assignment

## Essential Bash Commands

### Docker Operations (ALWAYS use these)
```bash
# Start/Stop Services
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose restart frontend   # Restart specific service
docker compose restart backend
docker compose ps                 # Check container status

# Logs (Critical for debugging)
docker compose logs -f            # Follow all logs
docker compose logs -f backend    # Backend logs only
docker compose logs -f frontend   # Frontend logs only
docker compose logs --tail=50 backend  # Last 50 lines

# Container Shell Access
docker compose exec backend bash  # Backend shell
docker compose exec frontend sh   # Frontend shell
docker compose exec db psql -U school_admin -d school_management  # DB shell

# NPM Commands (MUST run inside container)
docker compose exec frontend npm install <package>  # Install package
docker compose exec frontend npm run build          # Build frontend
```

### Management Script (Preferred Method)
```bash
./manage.sh start      # Start all services
./manage.sh stop       # Stop all services
./manage.sh restart    # Restart services
./manage.sh status     # Check status
./manage.sh logs       # View all logs
./manage.sh backup     # Backup database
./manage.sh shell db   # Access database shell
```

### Database Operations
```bash
# Migrations (Backend container)
docker compose exec backend alembic revision --autogenerate -m "description"
docker compose exec backend alembic upgrade head
docker compose exec backend alembic downgrade -1

# Direct SQL
docker compose exec db psql -U school_admin -d school_management -c "SELECT * FROM students LIMIT 5;"
```

## Project Structure

```
/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/v1/endpoints/     # API routes (students, fees, payments, etc.)
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/             # Business logic layer
│   │   ├── utils/                # Helpers (auth, sms, etc.)
│   │   ├── core/                 # Config, security
│   │   └── db/                   # Database session management
│   ├── alembic/                  # Database migrations
│   ├── scripts/                  # Utility scripts
│   └── requirements.txt
│
├── frontend/                # React TypeScript application
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components (9 main pages)
│   │   ├── services/api.ts      # Centralized API client
│   │   ├── contexts/            # React contexts (Auth, Toast)
│   │   ├── config/              # Design system, constants
│   │   ├── hooks/               # Custom React hooks
│   │   └── utils/               # Helper functions
│   └── package.json
│
├── docs/                    # Documentation
├── docker-compose.yml       # Development environment
├── manage.sh                # Management script
└── .env                     # Environment variables (NOT IN GIT)
```

## Code Style Guidelines

### Backend (Python/FastAPI)

**IMPORTANT: Follow these conventions strictly**

1. **Use async/await for all database operations**
   ```python
   # ✅ CORRECT
   async def get_students(db: AsyncSession):
       result = await db.execute(select(Student))
       return result.scalars().all()

   # ❌ WRONG - Don't use synchronous operations
   def get_students(db: Session):
       return db.query(Student).all()
   ```

2. **Pydantic schemas for validation**
   ```python
   # Always define request/response schemas
   class StudentCreate(BaseModel):
       admission_number: str = Field(..., min_length=1, max_length=20)
       first_name: str = Field(..., min_length=1, max_length=100)
       # ... more fields
   ```

3. **Money handling - ALWAYS use integers (paise/cents)**
   ```python
   # ✅ CORRECT - Store as integers (paise)
   tuition_fee: int  # 500000 = ₹5000.00

   # ❌ WRONG - Don't use floats for money
   tuition_fee: float  # Causes rounding errors
   ```

4. **API endpoint patterns**
   ```python
   @router.get("/", response_model=List[StudentResponse])
   async def get_students(
       skip: int = Query(0, ge=0),
       limit: int = Query(50, ge=1, le=100),  # Max 100 items per page
       db: AsyncSession = Depends(get_db),
       current_user: User = Depends(get_current_active_user)
   ):
   ```

5. **Service layer separation**
   ```python
   # Business logic goes in services/, not endpoints
   # Endpoints should be thin controllers
   ```

### Frontend (React/TypeScript)

**IMPORTANT: Follow these conventions strictly**

1. **Use TanStack Table for ALL tables**
   ```typescript
   // ✅ CORRECT - Use TanStack Table
   import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

   // ❌ WRONG - Don't create custom table components
   // The old custom Table component is deprecated
   ```

2. **API calls via centralized client**
   ```typescript
   // ✅ CORRECT - Use apiClient
   import { apiClient } from '../services/api';
   const students = await apiClient.getStudents({ page: 1, page_size: 50 });

   // ❌ WRONG - Don't use axios directly
   import axios from 'axios';
   const response = await axios.get('/api/students');
   ```

3. **TypeScript - No `any` types**
   ```typescript
   // ✅ CORRECT
   interface Student {
       id: number;
       first_name: string;
       // ...
   }
   const students: Student[] = data;

   // ❌ WRONG
   const students: any = data;
   ```

4. **Component structure**
   ```typescript
   // Pages go in src/pages/
   // Reusable components in src/components/
   // Keep components < 400 lines (split if larger)
   ```

5. **State management**
   ```typescript
   // Use React Context for global state (Auth, Toast)
   // Use local useState for component state
   // No Redux or external state libraries
   ```

## Database Conventions

### Schema Design Rules

1. **Monetary values as INTEGER (paise)**
   - `tuition_fee INTEGER` not DECIMAL
   - Frontend converts: `amount / 100` for display
   - Backend stores: `amount * 100`

2. **Timestamps**
   ```sql
   created_at TIMESTAMP DEFAULT NOW()
   updated_at TIMESTAMP DEFAULT NOW()
   ```

3. **Soft deletes via status**
   ```sql
   status VARCHAR(20) DEFAULT 'active'  -- active, inactive, deleted
   ```

4. **Foreign keys with CASCADE**
   ```sql
   FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
   ```

### Migration Naming Convention
```bash
# Use descriptive migration names
alembic revision --autogenerate -m "add_section_assignment_table"
alembic revision --autogenerate -m "add_performance_fields_to_students"
```

## Testing Instructions

### Backend Testing
```bash
# Run tests (when implemented)
docker compose exec backend pytest
docker compose exec backend pytest tests/test_students.py -v

# Manual API testing
curl -X POST http://localhost:10221/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Frontend Testing
```bash
# Manual testing checklist
1. Test on http://internal3.paperentry.ai:10222
2. Login with: admin / admin123
3. Check all pages: Dashboard, Students, Fees, Payments, Reports, Settings
4. Test table sorting, filtering, pagination
5. Test CRUD operations (Create, Read, Update, Delete)
```

## Development Workflow

### Making Changes

1. **Backend changes:**
   ```bash
   # Edit files in backend/app/
   # Changes auto-reload with uvicorn --reload
   # Check logs: docker compose logs -f backend
   ```

2. **Frontend changes:**
   ```bash
   # Edit files in frontend/src/
   # Vite HMR updates automatically
   # Check logs: docker compose logs -f frontend
   ```

3. **Database changes:**
   ```bash
   # 1. Update model in backend/app/models/
   # 2. Generate migration
   docker compose exec backend alembic revision --autogenerate -m "description"
   # 3. Review migration file in backend/alembic/versions/
   # 4. Apply migration
   docker compose exec backend alembic upgrade head
   ```

### Git Workflow

**IMPORTANT: Don't commit sensitive files**
```bash
# Never commit:
- .env (use .env.example as template)
- __pycache__/
- node_modules/
- *.pyc
- frontend/dist/
- backend/logs/

# Commit messages should be descriptive
git commit -m "Add section assignment feature to batch management"
git commit -m "Fix class display issue in Students table"
```

## Common Patterns

### Backend: Adding a new API endpoint

```python
# 1. Create Pydantic schemas (backend/app/schemas/)
class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

# 2. Create endpoint (backend/app/api/v1/endpoints/items.py)
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/items", tags=["items"])

@router.post("/", response_model=ItemResponse)
async def create_item(
    item: ItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Implementation
    pass

# 3. Register router (backend/app/api/v1/router.py)
from .endpoints import items
api_router.include_router(items.router)
```

### Frontend: Adding a new page

```typescript
// 1. Create page component (frontend/src/pages/NewPage.tsx)
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiClient } from '../services/api';

export default function NewPage() {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const result = await apiClient.getItems();
            setData(result);
        };
        fetchData();
    }, []);

    return (
        <Layout>
            <h1>New Page</h1>
            {/* Content */}
        </Layout>
    );
}

// 2. Add route (frontend/src/App.tsx)
import NewPage from './pages/NewPage';
// Add to <Routes>
<Route path="/newpage" element={<NewPage />} />

// 3. Add navigation (frontend/src/components/Layout.tsx)
// Add menu item to navigation
```

### Frontend: TanStack Table Pattern

```typescript
// Standard pattern for tables
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';

const columns = useMemo<ColumnDef<Item>[]>(
    () => [
        { accessorKey: 'name', header: 'Name', cell: info => info.getValue() },
        { accessorKey: 'status', header: 'Status', enableSorting: true },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <button onClick={() => handleEdit(row.original)}>Edit</button>
            ),
        },
    ],
    []
);

const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
});
```

## Port Configuration

**IMPORTANT: Use these ports consistently**

- **Database:** `10220` (PostgreSQL)
- **Backend API:** `10221` (FastAPI)
- **Frontend UI:** `10222` (React/Vite)
- **Nginx HTTP:** `10223` (Production)
- **Nginx HTTPS:** `10224` (Production)

Access URLs:
- Frontend: `http://localhost:10222` or `http://internal3.paperentry.ai:10222`
- Backend API: `http://localhost:10221`
- API Docs: `http://localhost:10221/docs`

## Common Issues & Quirks

### 1. Permission Errors with npm install
**Problem:** `npm install` on host fails with EACCES
**Solution:** ALWAYS run npm commands inside container
```bash
# ✅ CORRECT
docker compose exec frontend npm install @tanstack/react-table

# ❌ WRONG
cd frontend && npm install @tanstack/react-table
```

### 2. Backend Page Size Limit
**Problem:** 422 error when fetching many records
**Solution:** Backend limits `page_size` to 100 max
```python
# Use SQL aggregation for statistics instead
# See: backend/app/api/v1/endpoints/batch.py - get_statistics()
```

### 3. Class Display (class_id vs class_name)
**Problem:** Tables showing "16" instead of "Class 1"
**Solution:** Backend must JOIN with Class table and return `class_name`
```python
# Always include class_name in student responses
query = select(Student, Class.name.label("class_name")).outerjoin(Class)
```

### 4. Monetary Values
**Problem:** Floating point errors in fee calculations
**Solution:** All monetary values stored as integers (paise)
```python
# Backend stores: 500000 (paise)
# Frontend displays: ₹5,000.00 (amount / 100)
```

### 5. Section Assignment
**Problem:** Students showing "-" for section
**Solution:** Must run batch assignment first
```bash
# Assign sections to a class
curl -X POST "http://localhost:10221/api/v1/batch/assign-sections" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"class_id": 16, "academic_year_id": 1, "strategy": "alphabetical"}'
```

## Important Notes

### DO NOT:
- ❌ Commit `.env` file (contains secrets)
- ❌ Use `git push --force` to main branch
- ❌ Run npm install on host (permission issues)
- ❌ Use `any` type in TypeScript
- ❌ Create custom table components (use TanStack Table)
- ❌ Use floats for money (use integers)
- ❌ Skip database migrations
- ❌ Hardcode API URLs (use environment variables)

### ALWAYS:
- ✅ Use async/await for database operations
- ✅ Run npm commands inside Docker container
- ✅ Test API changes via `/docs` endpoint first
- ✅ Check logs when debugging: `docker compose logs -f`
- ✅ Create migrations after model changes
- ✅ Use TanStack Table for all tables
- ✅ Store money as integers (paise)
- ✅ Include authentication in API calls
- ✅ Handle errors gracefully with try/catch
- ✅ Use TypeScript interfaces (no `any`)

## Key Files Reference

### Must-read before changes:
- `docs/ARCHITECTURE.md` - System architecture overview
- `docs/DATABASE_SCHEMA.md` - Database design
- `docs/BATCH_MANAGEMENT.md` - Smart batch system
- `backend/app/services/` - Business logic patterns
- `frontend/src/services/api.ts` - API client structure
- `frontend/src/components/Table.tsx` - Deprecated (use TanStack)

### Configuration:
- `.env` - Environment variables (local only)
- `.env.example` - Template for .env
- `docker-compose.yml` - Container configuration
- `backend/alembic.ini` - Migration settings
- `frontend/vite.config.ts` - Frontend build config

## Performance Tips

1. **Use SQL aggregation for statistics** (not fetching all records)
2. **Paginate API responses** (max 100 items per page)
3. **Index foreign keys** in database
4. **Use React.memo()** for expensive components
5. **Debounce search inputs** (300ms delay)

## Quick Reference URLs

- Frontend UI: http://internal3.paperentry.ai:10222
- Backend API: http://internal3.paperentry.ai:10221
- API Docs: http://internal3.paperentry.ai:10221/docs
- Database: localhost:10220

Default Login: `admin` / `admin123`

## Support & Documentation

- Main README: `/README.md`
- Architecture: `/docs/ARCHITECTURE.md`
- Database Schema: `/docs/DATABASE_SCHEMA.md`
- Batch Management: `/docs/BATCH_MANAGEMENT.md`
- Docker Guide: `/docs/DOCKER_GUIDE.md`

---

**Last Updated:** November 2024
**Project Status:** Active Development
**Primary Stack:** FastAPI 0.104.1, React 18.3.1, PostgreSQL 15, Docker
