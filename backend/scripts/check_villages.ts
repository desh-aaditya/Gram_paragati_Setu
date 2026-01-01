import pool from '../src/config/database';

async function listVillages() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, name, district FROM villages ORDER BY name');
        console.log('Current Villages:');
        res.rows.forEach(v => console.log(`${v.id}: ${v.name} (${v.district})`));
    } catch (error) {
        console.error('Error listing villages:', error);
    } finally {
        client.release();
        pool.end();
    }
}

listVillages();
