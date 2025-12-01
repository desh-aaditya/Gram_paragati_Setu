# Setup Guide

## Prerequisites

1. **Install Bun**: https://bun.sh/docs/installation
2. **Install PostgreSQL**: https://www.postgresql.org/download/
3. **Enable PostGIS extension** in PostgreSQL

## Step-by-Step Setup

### 1. Database Setup

```bash
# Create database
createdb gram_pragati_setu

# Connect and enable PostGIS
psql gram_pragati_setu
CREATE EXTENSION IF NOT EXISTS postgis;
\q

# Run migrations
psql -d gram_pragati_setu -f database/migrations/001_initial_schema.sql

# Seed data (Note: You'll need to generate proper password hashes - see below)
psql -d gram_pragati_setu -f database/seed.sql
```

### 2. Generate Password Hashes

The seed.sql file contains placeholder password hashes. To generate proper bcrypt hashes:

**Option A: Using Node.js/Bun:**

```javascript
const bcrypt = require('bcrypt');
// Generate hash for 'admin123'
bcrypt.hash('admin123', 10).then(hash => console.log(hash));
```

**Option B: Using online tool or Python:**

```python
import bcrypt
hash = bcrypt.hashpw(b'admin123', bcrypt.gensalt())
print(hash.decode())
```

Update the `password_hash` values in `database/seed.sql` before running it.

**Default passwords (for reference):**
- Officer: `admin123`
- Employee: `emp123`

### 3. Backend Setup

```bash
cd backend
bun install

# Create .env file (copy from .env.example and update values)
cp .env.example .env
# Edit .env with your database credentials

# Start backend
bun run dev
```

The backend should start on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend
bun install

# Start frontend (in a new terminal)
bun dev
```

The frontend should start on `http://localhost:3000`

### 5. Verify Installation

1. Open `http://localhost:3000` in your browser
2. Click "Employee Login" or navigate to `/login`
3. Try logging in with:
   - Username: `officer1`
   - Password: `admin123` (if you updated the hash)

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running: `pg_isready`
- Check credentials in `backend/.env`
- Verify database exists: `psql -l | grep gram_pragati_setu`

### Port Already in Use

- Backend default: 5000
- Frontend default: 3000
- Change in `.env` (backend) or `vite.config.ts` (frontend)

### PostGIS Not Found

```bash
# Install PostGIS extension
# On Ubuntu/Debian:
sudo apt-get install postgresql-postgis

# On macOS:
brew install postgis

# Then enable in database:
psql -d gram_pragati_setu -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

## Next Steps

After setup:
1. Login as officer or employee
2. Explore the dashboard
3. View villages on the map
4. Check projects and analytics
5. Test language switching (EN/HI/TA)
6. Try accessibility toolbar features

## Development

- Backend logs: Check terminal running `bun run dev`
- Frontend logs: Check browser console
- Database: Use `psql -d gram_pragati_setu` to query directly
