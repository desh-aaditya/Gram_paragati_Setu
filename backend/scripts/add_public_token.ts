
import pool from '../src/config/database';
import { v4 as uuidv4 } from 'uuid';

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: add_public_token');

        // 1. Add column if not exists
        await client.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
    `);
        console.log('Added public_token column');

        // 2. Get projects without token
        const result = await client.query('SELECT id FROM projects WHERE public_token IS NULL');
        console.log(`Found ${result.rows.length} projects to update`);

        // 3. Update each project
        for (const row of result.rows) {
            const token = uuidv4();
            await client.query('UPDATE projects SET public_token = $1 WHERE id = $2', [token, row.id]);
            console.log(`Updated project ${row.id} with token ${token}`);
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
