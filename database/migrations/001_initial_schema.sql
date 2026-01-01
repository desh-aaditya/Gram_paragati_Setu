-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (Officers and Employees)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('officer', 'employee')),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Employees assigned villages
CREATE TABLE employee_villages (
    employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    village_id INTEGER, -- Will reference villages table
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (employee_id, village_id)
);

-- Villages table with PostGIS geometry
CREATE TABLE villages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    block VARCHAR(100),
    population INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geometry GEOGRAPHY(POLYGON, 4326), -- PostGIS geometry for polygon
    baseline_metrics JSONB, -- Infrastructure, literacy, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Add foreign key constraint for employee_villages
ALTER TABLE employee_villages ADD CONSTRAINT fk_village 
    FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE;

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    village_id INTEGER REFERENCES villages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(100),
    allocated_amount DECIMAL(12, 2) NOT NULL,
    utilized_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold')),
    start_date DATE,
    end_date DATE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project checkpoints
CREATE TABLE checkpoints (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    checkpoint_order INTEGER NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    estimated_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Checkpoint submissions from volunteers (mobile sync)
CREATE TABLE checkpoint_submissions (
    id SERIAL PRIMARY KEY,
    checkpoint_id INTEGER REFERENCES checkpoints(id) ON DELETE CASCADE,
    volunteer_id VARCHAR(100), -- Volunteer mobile app ID
    submitted_at TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'requires_revision')),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    client_id VARCHAR(255) UNIQUE, -- For mobile sync idempotency
    server_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media files (photos, audio, documents)
CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES checkpoint_submissions(id) ON DELETE CASCADE,
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('photo', 'audio', 'document', 'video')),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fund transactions
CREATE TABLE fund_transactions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('allocation', 'release', 'adjustment')),
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adarsh village scores (computed scores)
CREATE TABLE adarsh_scores (
    id SERIAL PRIMARY KEY,
    village_id INTEGER REFERENCES villages(id) ON DELETE CASCADE UNIQUE,
    overall_score DECIMAL(5, 2) NOT NULL, -- 0-100
    infrastructure_score DECIMAL(5, 2) DEFAULT 0,
    completion_rate_score DECIMAL(5, 2) DEFAULT 0,
    social_indicators_score DECIMAL(5, 2) DEFAULT 0,
    feedback_score DECIMAL(5, 2) DEFAULT 0,
    fund_utilization_score DECIMAL(5, 2) DEFAULT 0,
    score_breakdown JSONB, -- Detailed breakdown
    is_adarsh_candidate BOOLEAN DEFAULT false,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync logs for mobile app
CREATE TABLE sync_logs (
    id SERIAL PRIMARY KEY,
    volunteer_id VARCHAR(100),
    sync_type VARCHAR(50),
    client_ids TEXT[], -- Array of client IDs synced
    synced_count INTEGER,
    sync_status VARCHAR(50) DEFAULT 'success',
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_villages_state_district ON villages(state, district);
CREATE INDEX idx_villages_geometry ON villages USING GIST(geometry);
CREATE INDEX idx_projects_village ON projects(village_id);
CREATE INDEX idx_checkpoints_project ON checkpoints(project_id);
CREATE INDEX idx_submissions_checkpoint ON checkpoint_submissions(checkpoint_id);
CREATE INDEX idx_submissions_status ON checkpoint_submissions(status);
CREATE INDEX idx_submissions_client_id ON checkpoint_submissions(client_id);
CREATE INDEX idx_media_submission ON media(submission_id);
CREATE INDEX idx_fund_transactions_project ON fund_transactions(project_id);
CREATE INDEX idx_adarsh_scores_village ON adarsh_scores(village_id);
CREATE INDEX idx_adarsh_scores_candidate ON adarsh_scores(is_adarsh_candidate);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_villages_updated_at BEFORE UPDATE ON villages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adarsh_scores_updated_at BEFORE UPDATE ON adarsh_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
