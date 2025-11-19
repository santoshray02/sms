# School Management System - Frontend

React + TypeScript frontend for the School Management System.

## Quick Start

### Prerequisites
- Node.js 18+
- Backend API running at http://localhost:8000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000

### Default Login
- Admin: `admin` / `admin123`
- Accountant: `accountant` / `account123`

## Project Structure

```
frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication context
│   ├── pages/
│   │   ├── Login.tsx            # Login page
│   │   └── Dashboard.tsx        # Dashboard with collection summary
│   ├── services/
│   │   └── api.ts               # API client with all endpoints
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts (to be created)
```

## Features Implemented

### ✅ Authentication
- Login/logout flow
- JWT token management
- Protected routes
- Role-based access (Admin/Accountant)

### ✅ API Client
Complete TypeScript client for all backend endpoints:
- Authentication
- Student management
- Academic setup (classes, years, routes)
- Fee management
- Payment recording
- Reports and analytics

### ✅ Dashboard
- Real-time collection summary
- Total fees, collected, pending
- Collection percentage
- Student counts by status

## API Integration

The API client (`src/services/api.ts`) provides methods for all backend endpoints:

```typescript
import { apiClient } from './services/api';

// Authentication
await apiClient.login(username, password);
await apiClient.logout();
const user = await apiClient.getCurrentUser();

// Students
const students = await apiClient.getStudents({ page: 1, page_size: 50 });
const student = await apiClient.getStudent(id);
await apiClient.createStudent(data);

// Fees
const fees = await apiClient.getMonthlyFees({ student_id: 1 });
await apiClient.generateMonthlyFees({ academic_year_id: 1, month: 1, year: 2025 });

// Payments
await apiClient.createPayment({ monthly_fee_id: 1, amount: 5000, ... });

// Reports
const summary = await apiClient.getCollectionSummary();
const defaulters = await apiClient.getDefaulters();
```

## Pages to Build

The basic structure is in place. Here's what you can add:

### 1. Students Page
- List all students with search and filters
- Student enrollment form
- Student profile with fee history
- Edit student details

### 2. Fee Management
- View fee structures
- Generate monthly fees
- View pending fees by student/class
- Fee configuration

### 3. Payments
- Record new payment
- Payment history
- Receipt viewing/printing
- Payment search

### 4. Reports
- Defaulters list with filters
- Class-wise collection report
- Payment mode breakdown
- SMS logs viewer
- Export to Excel/PDF

### 5. Settings
- Academic year management
- Class setup
- Transport route configuration
- System settings

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router v6** - Routing

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Development Tips

1. **Hot Reload:** Changes auto-refresh in development
2. **TypeScript:** Use types from API responses
3. **Error Handling:** Already implemented in API client
4. **Authentication:** Tokens stored in localStorage
5. **401 Errors:** Auto-redirect to login

## Building for Production

```bash
# Build
npm run build

# Preview production build
npm run preview
```

Output in `dist/` directory.

## Deployment

### Option 1: Static Hosting (Vercel, Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Option 2: Docker
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Option 3: Serve with Backend
Copy `dist/` to backend's `static/` folder and serve with FastAPI.

## Next Steps

1. **Complete remaining pages:**
   - Students management
   - Fee management UI
   - Payment recording form
   - Reports dashboards

2. **Add features:**
   - Data tables with sorting
   - Export to Excel/PDF
   - Print receipts
   - Charts for analytics
   - Notifications/toasts

3. **UI Libraries (optional):**
   - **Shadcn/ui** - Pre-built components
   - **React Query** - Data fetching/caching
   - **React Hook Form** - Form handling
   - **Recharts** - Data visualization

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
```

## Support

- Backend API: http://localhost:8000/docs
- Backend Documentation: ../backend/README.md
- API Testing: ../backend/API_TESTING_GUIDE.md

---

**Status:** Basic structure complete, ready for UI development
**API Integration:** ✅ Complete
**Authentication:** ✅ Working
**Dashboard:** ✅ Functional
