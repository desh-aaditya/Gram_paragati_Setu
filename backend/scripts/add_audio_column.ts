import pool from '../src/config/database';

async function migrate() {
    try {
        await pool.query(`
      ALTER TABLE village_priority_votes 
      ADD COLUMN IF NOT EXISTS audio_url TEXT;
    `);
        console.log('Added audio_url column successfully');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

migrate();
