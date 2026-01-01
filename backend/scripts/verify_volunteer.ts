import pool from '../src/config/database';
import { comparePassword, hashPassword } from '../src/config/auth';

async function verify() {
    try {
        console.log('Verifying volunteer data...');

        // Check volunteer
        const res = await pool.query('SELECT * FROM volunteers WHERE username = $1', ['volunteer1']);
        if (res.rows.length === 0) {
            console.log('❌ Volunteer "volunteer1" not found!');
        } else {
            console.log('✅ Volunteer "volunteer1" found.');
            const vol = res.rows[0];

            // Verify password
            const isMatch = await comparePassword('emp123', vol.password_hash);
            console.log(`Password "emp123" match: ${isMatch ? '✅ Yes' : '❌ No'}`);

            if (!isMatch) {
                console.log('Generating new hash for "emp123"...');
                const newHash = await hashPassword('emp123');
                await pool.query('UPDATE volunteers SET password_hash = $1 WHERE id = $2', [newHash, vol.id]);
                console.log('✅ Password updated.');
            }

            // Check assigned villages
            console.log('Assigned villages:', vol.assigned_villages);

            // Check projects
            const projects = await pool.query('SELECT id, title FROM projects WHERE village_id = ANY($1::int[])', [vol.assigned_villages]);
            console.log(`Found ${projects.rows.length} projects for assigned villages.`);
            projects.rows.forEach(p => console.log(`- ${p.title} (ID: ${p.id})`));
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

verify();
