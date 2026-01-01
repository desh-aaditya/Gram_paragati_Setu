import pool from '../src/config/database';

async function checkUsers() {
    const client = await pool.connect();
    try {
        const users = await client.query('SELECT id, username, role, password_hash FROM users');
        console.log(`Found ${users.rowCount} users.`);
        users.rows.forEach(u => console.log(`${u.id}: ${u.username} (${u.role})`));
    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

checkUsers();
