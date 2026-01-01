import pool from '../src/config/database';

async function createMediaTable() {
    try {
        console.log('Creating media table...');
        await pool.query(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER REFERENCES checkpoint_submissions(id),
        type VARCHAR(20) NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Media table created successfully');
    } catch (error) {
        console.error('❌ Error creating media table:', error);
    } finally {
        pool.end();
    }
}

createMediaTable();
