import pool from '../src/config/database';

async function checkSchema() {
    try {
        const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'village_priority_votes'
    `);
        console.log(result.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkSchema();
