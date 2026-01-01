-- Migration: Add village_priority_votes table for mobile app submissions
-- This table stores infrastructure priority requests from villagers and volunteers

CREATE TABLE IF NOT EXISTS village_priority_votes (
    id SERIAL PRIMARY KEY,
    village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    required_infrastructure VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    total_votes INTEGER DEFAULT 1,
    is_volunteer BOOLEAN DEFAULT FALSE,
    volunteer_id VARCHAR(100), -- Volunteer mobile app ID if submitted by volunteer
    employee_id INTEGER REFERENCES users(id), -- Employee who created the volunteer account
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_id VARCHAR(255), -- For mobile sync idempotency
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_village_priority_village ON village_priority_votes(village_id);
CREATE INDEX idx_village_priority_infrastructure ON village_priority_votes(required_infrastructure);
CREATE INDEX idx_village_priority_client ON village_priority_votes(client_id);

-- Create unique constraint to prevent duplicate submissions from same client
CREATE UNIQUE INDEX IF NOT EXISTS idx_village_priority_unique 
    ON village_priority_votes(village_id, required_infrastructure, client_id) 
    WHERE client_id IS NOT NULL;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_village_priority_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_village_priority_votes_updated_at
    BEFORE UPDATE ON village_priority_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_village_priority_votes_updated_at();

-- Add volunteers table for mobile app volunteers
CREATE TABLE IF NOT EXISTS volunteers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    employee_id INTEGER REFERENCES users(id), -- Employee who created this volunteer
    assigned_villages INTEGER[], -- Array of village IDs assigned to volunteer
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_volunteers_employee ON volunteers(employee_id);
CREATE INDEX idx_volunteers_username ON volunteers(username);

-- Add volunteer_id foreign key to checkpoint_submissions if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkpoint_submissions' 
        AND column_name = 'volunteer_id'
    ) THEN
        ALTER TABLE checkpoint_submissions 
        ADD COLUMN volunteer_id VARCHAR(100);
    END IF;
END $$;

-- Add notes and location fields to checkpoint_submissions if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkpoint_submissions' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE checkpoint_submissions 
        ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkpoint_submissions' 
        AND column_name = 'location_lat'
    ) THEN
        ALTER TABLE checkpoint_submissions 
        ADD COLUMN location_lat DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkpoint_submissions' 
        AND column_name = 'location_lng'
    ) THEN
        ALTER TABLE checkpoint_submissions 
        ADD COLUMN location_lng DECIMAL(11, 8);
    END IF;
END $$;







