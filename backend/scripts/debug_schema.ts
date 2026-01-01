import pool from '../src/config/database';
import fs from 'fs';

async function debugSchema() {
    try {
        const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'village_priority_votes';
    `);

        const output = JSON.stringify(result.rows, null, 2);
        fs.writeFileSync('debug_schema.txt', output);
        console.log('Schema dumped to debug_schema.txt');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

debugSchema();
