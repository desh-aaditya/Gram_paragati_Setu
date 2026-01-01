import pool from '../src/config/database';
import bcrypt from 'bcryptjs';

async function seedUsers() {
    const client = await pool.connect();
    try {
        console.log('Seeding users...');
        await client.query('BEGIN');

        const passwordHash = await bcrypt.hash('password123', 10);

        // Insert officer1 if not exists
        await client.query(`
      INSERT INTO users (username, email, password_hash, role, full_name, department)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (username) DO UPDATE 
      SET password_hash = $3
    `, ['officer1', 'officer1@gramsetu.gov.in', passwordHash, 'officer', 'Rajesh Kumar', 'Rural Development']);

        await client.query('COMMIT');
        console.log('Users seeded successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Seed failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

seedUsers();
