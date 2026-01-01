
import pool from '../src/config/database';

async function checkSkills() {
    const client = await pool.connect();
    try {
        console.log('Checking recent skill entries...');
        const res = await client.query('SELECT * FROM skill_bank ORDER BY created_at DESC LIMIT 5');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

checkSkills();
