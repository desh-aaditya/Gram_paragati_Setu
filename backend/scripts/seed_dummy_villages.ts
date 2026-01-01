import pool from '../src/config/database';

async function seedVillages() {
    const client = await pool.connect();
    try {
        console.log('Seeding dummy villages...');
        await client.query('BEGIN');

        // Insert dummy villages
        await client.query(`
      INSERT INTO villages (name, state, district, block, population, latitude, longitude, is_active, baseline_metrics) VALUES
      ('Rampur', 'Uttar Pradesh', 'Lucknow', 'Bakshi Ka Talab', 2500, 26.9876, 80.9876, true, '{"infrastructure_score": 60, "healthcare_facilities": 2, "schools": 3, "literacy_rate": 75, "employment_rate": 60}'),
      ('Sonpur', 'Bihar', 'Saran', 'Sonpur', 3000, 25.6987, 85.1234, true, '{"infrastructure_score": 50, "healthcare_facilities": 1, "schools": 2, "literacy_rate": 65, "employment_rate": 55}'),
      ('Madhopur', 'Rajasthan', 'Jaipur', 'Sanganer', 1800, 26.8765, 75.7654, true, '{"infrastructure_score": 70, "healthcare_facilities": 3, "schools": 4, "literacy_rate": 80, "employment_rate": 70}'),
      ('Kishanpur', 'Madhya Pradesh', 'Bhopal', 'Huzur', 2200, 23.2599, 77.4126, true, '{"infrastructure_score": 65, "healthcare_facilities": 2, "schools": 2, "literacy_rate": 72, "employment_rate": 58}'),
      ('Lakhanpur', 'Chhattisgarh', 'Surguja', 'Lakhanpur', 1500, 22.9987, 83.0012, true, '{"infrastructure_score": 55, "healthcare_facilities": 1, "schools": 2, "literacy_rate": 60, "employment_rate": 50}')
      ON CONFLICT DO NOTHING;
    `);

        await client.query('COMMIT');
        console.log('Dummy villages seeded successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Seed failed:', error);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

seedVillages();
