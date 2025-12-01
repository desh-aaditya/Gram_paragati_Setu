# Quick Start Guide

## Prerequisites Check

```bash
# Check Bun
bun --version

# Check PostgreSQL
psql --version

# Check PostGIS
psql -d postgres -c "SELECT PostGIS_version();"
```

## 5-Minute Setup

### Step 1: Database (2 minutes)

```bash
# Create database
createdb gram_pragati_setu

# Enable PostGIS
psql -d gram_pragati_setu -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run schema
psql -d gram_pragati_setu -f database/migrations/001_initial_schema.sql

# Seed data (NOTE: Update password hashes first - see below)
psql -d gram_pragati_setu -f database/seed.sql
```

**Generate Password Hashes:**
```bash
# Quick way using Node.js/Bun
cd database
bun install bcrypt
bun run generate-hashes.js
# Copy the generated hashes into seed.sql, then run seed.sql
```

### Step 2: Backend (1 minute)

```bash
cd backend
bun install

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gram_pragati_setu
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
PORT=5000
CORS_ORIGIN=http://localhost:3000
EOF

# Start backend
bun run dev
```

### Step 3: Frontend (1 minute)

```bash
cd frontend
bun install

# Start frontend (in new terminal)
bun dev
```

### Step 4: Access (1 minute)

1. Open browser: `http://localhost:3000`
2. Click "Employee Login"
3. Login with: `officer1` / `admin123` (after updating hash)

## Verify Installation

- ✅ Home page loads with government branding
- ✅ Login page accessible
- ✅ Language switcher works (EN/HI/TA)
- ✅ Accessibility toolbar visible (right side)
- ✅ Dashboard shows after login

## Troubleshooting

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Change port in `vite.config.ts`

### Database Connection Failed
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `backend/.env`
- Check database exists: `psql -l | grep gram_pragati_setu`

### PostGIS Not Found
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-postgis

# macOS
brew install postgis
```

## Default Credentials

After proper setup with generated hashes:
- **Officer**: `officer1` / `admin123`
- **Employee**: `employee1` / `emp123`

## Next Steps

1. Explore dashboard
2. View villages on map
3. Check projects
4. Test language switching
5. Try accessibility features
