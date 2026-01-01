# Gram Pragati Setu - Backend API

Express.js TypeScript backend for the Gram Pragati Setu portal.

## Setup

1. Install dependencies:
```bash
bun install
```

2. Configure environment variables (create `.env` file):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gram_pragati_setu
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

3. Start development server:
```bash
bun run dev
```

## API Routes

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Villages
- `GET /api/villages` - List villages (with filters)
- `GET /api/villages/:id` - Get village details
- `POST /api/villages` - Create village (Officer only)
- `PUT /api/villages/:id` - Update village (Officer only)
- `DELETE /api/villages/:id` - Soft delete village (Officer only, uses `is_active` flag)

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project with checkpoints
- `POST /api/projects` - Create project (Officer only)
- `POST /api/projects/:id/checkpoints` - Add checkpoint (Officer only)

### Checkpoints
- `GET /api/checkpoints/:id/submissions` - Get submissions
- `POST /api/checkpoints/:id/submissions/:submissionId/review` - Review submission

### Sync (Mobile)
- `POST /api/sync/reports` - Batch sync reports from mobile
- `POST /api/sync/media/presign` - Get presigned upload URL

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/adarsh-distribution` - Adarsh score distribution
- `GET /api/analytics/village/:id` - Village-level analytics (fund trends, completion, Adarsh)
- `GET /api/analytics/state` - State / district-level overview (supports `state`, `from`, `to` filters)
- `GET /api/analytics/projects` - Project-level analytics and checkpoint aggregates

### Funds
- `GET /api/funds/summary` - Fund summary (allocated, utilized, remaining; filterable by state/district/village/project)
- `GET /api/funds/transactions` - Fund transactions with filters
- `POST /api/funds/allocate` - Allocate funds (Officer only; supports `tranche` and `note`)
- `POST /api/funds/release` - Release funds / mark utilization (Officer only; supports `note`)
- `PATCH /api/funds/:id` - Edit a fund transaction (Officer only, keeps project totals consistent)

### Employees
- `GET /api/employees` - List employees (Officer only)
- `POST /api/employees` - Create employee (Officer only)
- `PUT /api/employees/:id/villages` - Update village assignments (Officer only)

## Database

Ensure PostgreSQL is running with PostGIS extension enabled. Run migrations from the `database/` directory.

## Authentication

Uses JWT tokens. Include token in Authorization header:
```
Authorization: Bearer <token>
```
