# Database Schema and Migrations

PostgreSQL database schema with PostGIS extension for Gram Pragati Setu.

## Setup

1. Create database:
```bash
createdb gram_pragati_setu
```

2. Enable PostGIS:
```bash
psql -d gram_pragati_setu -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

3. Run migrations:
```bash
psql -d gram_pragati_setu -f migrations/001_initial_schema.sql
```

4. Seed sample data:
```bash
psql -d gram_pragati_setu -f seed.sql
```

## Schema Overview

### Core Tables

- **users** - Officers and Employees
- **villages** - Village information with PostGIS geometry
- **projects** - Projects per village
- **checkpoints** - Project checkpoints
- **checkpoint_submissions** - Volunteer submissions
- **media** - Photos, audio, documents
- **fund_transactions** - Fund allocation/release history
- **adarsh_scores** - Computed Adarsh scores
- **employee_villages** - Employee-village assignments
- **sync_logs** - Mobile sync logs
- **audit_logs** - Audit trail

## PostGIS

The schema uses PostGIS for spatial data:
- `villages.geometry` - GEOGRAPHY(POLYGON, 4326) for village boundaries
- Spatial indexes for efficient queries
- Functions like `ST_AsGeoJSON()` for map rendering

## Seed Data

The `seed.sql` file includes:
- Sample users (officers and employees)
- Sample villages with geometries
- Sample projects and checkpoints
- Sample submissions and media
- Initial Adarsh scores

Default credentials:
- Officer: `officer1` / `admin123`
- Employee: `employee1` / `emp123`
