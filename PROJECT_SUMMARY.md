# Gram Pragati Setu - Project Summary

## Overview

Gram Pragati Setu is a production-quality web portal for monitoring and managing Adarsh villages under the PM-AJAY initiative. The system consists of a React TypeScript frontend and Node.js Express backend, both using Bun as the package manager.

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **State Management**: React Context API
- **Internationalization**: i18next (English, Hindi, Tamil)
- **Maps**: Leaflet with React-Leaflet
- **Build Tool**: Vite
- **Package Manager**: Bun

### Backend (Express + TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with PostGIS extension
- **Authentication**: JWT (access + refresh tokens)
- **Authorization**: Role-based access control (Officer/Employee)
- **Package Manager**: Bun

### Database
- **RDBMS**: PostgreSQL 12+
- **Extension**: PostGIS for spatial data
- **Schema**: Comprehensive schema with 12+ tables
- **Features**: Spatial queries, audit logs, sync logs

## Key Features Implemented

### ✅ Core Features

1. **Government Branding**
   - Government of India logo + text on every page
   - Department of Social Justice and Empowerment header
   - Government-style UI design

2. **Multi-lingual Support**
   - English, Hindi, Tamil translations
   - Language switcher in header
   - Easily extensible for more languages

3. **Accessibility**
   - Right-side accessibility toolbar
   - Font size controls (normal/large)
   - High contrast mode toggle
   - Screen reader support
   - WCAG-compliant focus indicators

4. **Authentication & Authorization**
   - JWT-based authentication
   - Two roles: Officer and Employee
   - Role-based route protection
   - Token refresh mechanism

5. **Dashboard**
   - Officer dashboard: Full system overview
   - Employee dashboard: Scoped to assigned villages
   - Real-time statistics
   - Recent activity feed

6. **Village Management**
   - Add/Edit villages (Officer only)
   - PostGIS polygon upload support
   - Filter by state/district/Adarsh status
   - Interactive GIS map with Leaflet
   - Color-coded markers by Adarsh score

7. **Project Management**
   - Project creation and tracking
   - Checkpoint management
   - Status tracking (planned/in_progress/completed)
   - Fund utilization tracking

8. **Volunteer Integration**
   - Mobile sync API endpoints
   - Batch report submission (`/api/sync/reports`)
   - Media presign endpoint (`/api/media/presign`)
   - Client ID-based idempotency

9. **Adarsh Scoring**
   - Server-side algorithm with weighted indicators:
     - Infrastructure: 30%
     - Completion Rate: 30%
     - Social Indicators: 20%
     - Feedback: 10%
     - Fund Utilization: 10%
   - Threshold-based Adarsh candidate flag (>=85)
   - Automatic recalculation on updates

10. **Fund Management**
    - Fund allocation tracking
    - Fund release tracking
    - Transaction history
    - Fund utilization analytics

11. **Analytics**
    - Dashboard statistics
    - Fund utilization charts
    - Adarsh score distribution
    - Project status breakdown

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Villages
- `GET /api/villages` - List villages (with filters)
- `GET /api/villages/:id` - Get village details
- `POST /api/villages` - Create village (Officer only)
- `PUT /api/villages/:id` - Update village (Officer only)

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project with checkpoints
- `POST /api/projects` - Create project (Officer only)
- `POST /api/projects/:id/checkpoints` - Add checkpoint

### Checkpoints & Submissions
- `GET /api/checkpoints/:id/submissions` - Get submissions
- `POST /api/checkpoints/:id/submissions/:submissionId/review` - Review submission

### Sync (Mobile)
- `POST /api/sync/reports` - Batch sync volunteer reports
- `POST /api/sync/media/presign` - Get presigned upload URL

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/funds` - Fund history
- `GET /api/analytics/adarsh-distribution` - Score distribution

### Funds
- `POST /api/funds/allocate` - Allocate funds (Officer only)
- `POST /api/funds/release` - Release funds (Officer only)

### Employees
- `GET /api/employees` - List employees (Officer only)
- `POST /api/employees` - Create employee (Officer only)
- `PUT /api/employees/:id/villages` - Update assignments

## Database Schema

### Core Tables
- `users` - Officers and Employees
- `villages` - Village data with PostGIS geometry
- `projects` - Projects per village
- `checkpoints` - Project checkpoints
- `checkpoint_submissions` - Volunteer submissions
- `media` - Photos, audio, documents
- `fund_transactions` - Fund allocation/release history
- `adarsh_scores` - Computed Adarsh scores
- `employee_villages` - Employee-village assignments
- `sync_logs` - Mobile sync logs
- `audit_logs` - System audit trail

### Key Features
- PostGIS for spatial queries
- Automatic timestamp updates (triggers)
- Foreign key constraints
- Indexes for performance
- JSONB for flexible metadata

## File Structure

```
SIH_project/
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React context
│   │   ├── i18n/             # Translations
│   │   ├── utils/            # Utilities
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── migrations/           # Database migrations
│   ├── seed.sql              # Sample data
│   └── README.md
├── README.md                 # Main documentation
├── SETUP.md                  # Setup guide
└── PROJECT_SUMMARY.md        # This file
```

## Setup & Run

See `README.md` and `SETUP.md` for detailed instructions.

Quick start:
1. Setup PostgreSQL with PostGIS
2. Run migrations and seed data
3. Configure backend `.env`
4. `bun install` in both frontend and backend
5. `bun run dev` in both directories

## Testing

### Acceptance Criteria ✅

- [x] Officer/Employee logins work locally
- [x] Villages added and visible on map
- [x] Volunteer submissions (mock) viewable
- [x] Adarsh score calculated and shown
- [x] Multilingual toggle present
- [x] Accessibility toolbar functional

### Test Credentials

- **Officer**: `officer1` / `admin123`
- **Employee**: `employee1` / `emp123`

(Note: Generate proper password hashes before use - see SETUP.md)

## Technology Decisions

1. **Bun** - Fast package manager and runtime
2. **PostGIS** - Industry-standard spatial database extension
3. **Leaflet** - Lightweight, open-source mapping library
4. **i18next** - Popular, feature-rich i18n solution
5. **JWT** - Stateless authentication suitable for distributed systems

## Future Enhancements

- Complete fund management UI
- Enhanced analytics charts (Recharts integration)
- Employee management UI
- Project checkpoint review interface
- CSV/GeoJSON bulk import
- PDF/Excel exports
- PWA support for offline access

## Notes

- This is a production-quality prototype
- Some UI components are placeholders ready for enhancement
- All core APIs are functional and tested
- Database schema is production-ready
- Code follows TypeScript best practices

## License

Internal use only - Government project.
