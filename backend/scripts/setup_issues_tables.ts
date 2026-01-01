import pool from '../src/config/database';

async function setupIssuesTables() {
    try {
        console.log('Setting up issues tables...');

        // 1. village_issues table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS village_issues (
        id SERIAL PRIMARY KEY,
        client_id UUID,
        village_id INT REFERENCES villages(id),
        issue_type TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT,
        attachments JSONB DEFAULT '[]',
        vote_count INT DEFAULT 1,
        status TEXT DEFAULT 'pending_validation', -- pending_validation, validated, approved, rejected, converted
        is_volunteer BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Created village_issues table');

        // 2. issue_validations table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS issue_validations (
        id SERIAL PRIMARY KEY,
        issue_id INT REFERENCES village_issues(id),
        volunteer_id INT REFERENCES volunteers(id),
        notes TEXT,
        media JSONB DEFAULT '[]',
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Created issue_validations table');

        // 3. issue_votes table (for device-based idempotency)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS issue_votes (
        id SERIAL PRIMARY KEY,
        issue_id INT REFERENCES village_issues(id),
        device_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(issue_id, device_id)
      );
    `);
        console.log('Created issue_votes table');

        console.log('All tables set up successfully');
    } catch (error) {
        console.error('Error setting up tables:', error);
    } finally {
        await pool.end();
    }
}

setupIssuesTables();
