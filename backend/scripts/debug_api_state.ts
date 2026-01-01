import pool from '../src/config/database';

async function debugState() {
    const client = await pool.connect();
    try {
        console.log('--- USERS ---');
        const users = await client.query('SELECT id, username, role FROM users');
        users.rows.forEach(u => console.log(`${u.id}: ${u.username} (${u.role})`));

        console.log('\n--- VILLAGES ---');
        const villages = await client.query('SELECT id, name, is_active FROM villages');
        villages.rows.forEach(v => console.log(`${v.id}: ${v.name} (Active: ${v.is_active})`));

        console.log('\n--- SIMULATING OFFICER QUERY ---');
        // Query used in routes/villages.ts for non-employee (officer/admin)
        const query = `
      SELECT 
        v.id, v.name
      FROM villages v
      LEFT JOIN adarsh_scores a ON a.village_id = v.id
      WHERE v.is_active = true
      ORDER BY v.name
    `;
        const res = await client.query(query);
        console.log(`Query returned ${res.rowCount} rows.`);
        res.rows.forEach(r => console.log(`- ${r.name}`));

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

debugState();
