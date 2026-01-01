import pool from '../src/config/database';

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');
    await client.query('BEGIN');

    // Enable PostGIS
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis');

    // Drop existing tables
    await client.query('DROP TABLE IF EXISTS village_priority_votes, fund_transactions, employee_villages, adarsh_scores, media, checkpoint_submissions, checkpoints, projects, villages, users CASCADE');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        full_name VARCHAR(100),
        phone VARCHAR(20),
        department VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Villages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS villages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        district VARCHAR(50) NOT NULL,
        block VARCHAR(50),
        population INTEGER,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        geometry GEOMETRY(Polygon, 4326),
        baseline_metrics JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        village_id INTEGER REFERENCES villages(id),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        project_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold')),
        allocated_amount DECIMAL(15, 2) DEFAULT 0,
        utilized_amount DECIMAL(15, 2) DEFAULT 0,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Checkpoints table
    await client.query(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        sequence_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Checkpoint Submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS checkpoint_submissions (
        id SERIAL PRIMARY KEY,
        checkpoint_id INTEGER REFERENCES checkpoints(id),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'requires_revision')),
        submitted_by VARCHAR(100),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        review_notes TEXT,
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMP,
        client_id VARCHAR(100)
      )
    `);

    // Media table
    await client.query(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER REFERENCES checkpoint_submissions(id),
        type VARCHAR(20) NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Adarsh Scores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS adarsh_scores (
        village_id INTEGER PRIMARY KEY REFERENCES villages(id),
        overall_score DECIMAL(5, 2) DEFAULT 0,
        infrastructure_score DECIMAL(5, 2) DEFAULT 0,
        completion_rate_score DECIMAL(5, 2) DEFAULT 0,
        social_indicators_score DECIMAL(5, 2) DEFAULT 0,
        feedback_score DECIMAL(5, 2) DEFAULT 0,
        fund_utilization_score DECIMAL(5, 2) DEFAULT 0,
        is_adarsh_candidate BOOLEAN DEFAULT false,
        score_breakdown JSONB DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employee Villages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_villages (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id),
        village_id INTEGER REFERENCES villages(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, village_id)
      )
    `);

    // Fund Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS fund_transactions (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('allocation', 'release')),
        amount DECIMAL(15, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Village Priority Votes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS village_priority_votes (
        id SERIAL PRIMARY KEY,
        village_id INTEGER REFERENCES villages(id),
        required_infrastructure VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        total_votes INTEGER DEFAULT 0,
        is_volunteer BOOLEAN DEFAULT false,
        volunteer_id INTEGER REFERENCES users(id),
        employee_id INTEGER REFERENCES users(id),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
