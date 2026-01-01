
import pool from '../src/config/database';

async function migrateSkills() {
    const client = await pool.connect();
    try {
        console.log('Starting Skill Bank migration...');
        await client.query('BEGIN');

        // 1. Create Skill Bank Table
        console.log('Creating skill_bank table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS skill_bank (
        id SERIAL PRIMARY KEY,
        village_id INTEGER REFERENCES villages(id),
        villager_name VARCHAR(255) NOT NULL,
        contact_number VARCHAR(15),
        skill_category VARCHAR(100) NOT NULL, -- Construction, Agriculture, Tailoring
        skill_level VARCHAR(50), -- Beginner, Intermediate, Expert
        experience_years INTEGER,
        availability VARCHAR(50), -- Full-time, Part-time
        preferred_location VARCHAR(100), -- Village, District, Anywhere
        verified_by_volunteer BOOLEAN DEFAULT FALSE,
        volunteer_id INTEGER REFERENCES users(id), -- ID of volunteer who verified
        proof_url TEXT, -- Optional photo/video proof
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 2. Create Job Postings Table (To match skills with)
        console.log('Creating job_postings table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS job_postings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        required_skill VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        wage_per_day INTEGER,
        is_government_project BOOLEAN DEFAULT FALSE,
        project_id INTEGER REFERENCES projects(id), -- Link to existing project if applicable
        contact_info VARCHAR(255),
        status VARCHAR(50) DEFAULT 'open', -- open, closed
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Index for faster searching
        await client.query(`CREATE INDEX IF NOT EXISTS idx_skill_category ON skill_bank(skill_category)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_skill_village ON skill_bank(village_id)`);

        await client.query('COMMIT');
        console.log('Skill Bank migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Skill Bank migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

migrateSkills();
