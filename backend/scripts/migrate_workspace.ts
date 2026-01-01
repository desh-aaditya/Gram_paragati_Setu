
import pool from '../src/config/database';

async function migrateWorkspace() {
    const client = await pool.connect();
    try {
        console.log('Starting Workspace migration...');
        await client.query('BEGIN');

        // 1. Update Project Status Constraint
        // We need to drop the existing check constraint and add a new one with 'sanctioned'
        console.log('Updating project status enum...');

        // First, find the constraint name. Usually it's projects_status_check
        await client.query(`
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check
    `);

        await client.query(`
      ALTER TABLE projects 
      ADD CONSTRAINT projects_status_check 
      CHECK (status IN ('planned', 'sanctioned', 'in_progress', 'completed', 'on_hold'))
    `);

        // 2. Create Workspaces Table
        console.log('Creating workspaces table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) UNIQUE,
        department VARCHAR(100), -- Linked department e.g. 'Education', 'Health'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 3. Create Workspace Messages Table
        console.log('Creating workspace_messages table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_messages (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER REFERENCES workspaces(id),
        user_id INTEGER REFERENCES users(id),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 4. Create Workspace Documents Table
        console.log('Creating workspace_documents table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_documents (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER REFERENCES workspaces(id),
        name VARCHAR(200) NOT NULL,
        url TEXT NOT NULL,
        uploaded_by INTEGER REFERENCES users(id),
        type VARCHAR(50), -- pdf, image, etc.
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await client.query('COMMIT');
        console.log('Workspace migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Workspace migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

migrateWorkspace();
