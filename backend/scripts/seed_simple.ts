import pool from '../src/config/database';
import bcrypt from 'bcryptjs';

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Starting simple seed...');
        await client.query('BEGIN');

        // Clear data
        await client.query('DELETE FROM media');
        await client.query('DELETE FROM checkpoint_submissions');
        await client.query('DELETE FROM checkpoints');
        await client.query('DELETE FROM fund_transactions');
        await client.query('DELETE FROM projects');
        await client.query('DELETE FROM adarsh_scores');
        await client.query('DELETE FROM employee_villages');
        await client.query('DELETE FROM village_priority_votes');
        await client.query('DELETE FROM villages');
        await client.query('DELETE FROM users');

        // Users
        const passwordHash = await bcrypt.hash('password123', 10);
        await client.query(`
      INSERT INTO users (username, email, password_hash, role, full_name, department) VALUES
      ('admin', 'admin@gramsetu.gov.in', $1, 'admin', 'System Administrator', 'IT'),
      ('officer1', 'officer1@gramsetu.gov.in', $1, 'officer', 'Rajesh Kumar', 'Rural Development'),
      ('employee1', 'employee1@gramsetu.gov.in', $1, 'employee', 'Suresh Singh', 'Field Operations')
    `, [passwordHash]);

        // Villages
        const villages = await client.query(`
      INSERT INTO villages (name, state, district, block, population, latitude, longitude, is_active, baseline_metrics) VALUES
      ('Rampur', 'Uttar Pradesh', 'Lucknow', 'Bakshi Ka Talab', 2500, 26.9876, 80.9876, true, '{"infrastructure_score": 60, "healthcare_facilities": 2, "schools": 3, "literacy_rate": 75, "employment_rate": 60}')
    RETURNING id`);
        console.log('Village created:', villages.rows[0].id);

        const rampurId = villages.rows[0].id;

        // Projects
        const projects = await client.query(`
      INSERT INTO projects (village_id, title, description, project_type, status, allocated_amount, utilized_amount, start_date, end_date) VALUES
      ($1, 'Road Construction', 'Building main road connecting to highway', 'infrastructure', 'in_progress', 500000, 200000, '2023-01-01', '2023-12-31')
    RETURNING id`, [rampurId]);
        console.log('Project created:', projects.rows[0].id);

        const roadProjectId = projects.rows[0].id;

        // Checkpoints
        await client.query(`
      INSERT INTO checkpoints (project_id, name, description, sequence_order) VALUES
      ($1, 'Foundation Laid', 'Initial foundation work completed', 1),
      ($1, 'Base Layer', 'Gravel base layer laid', 2),
      ($1, 'Tarring', 'Final tarring of the road', 3)
    `, [roadProjectId]);
        console.log('Checkpoints created');

        // Adarsh Scores (Initial)
        await client.query(`
      INSERT INTO adarsh_scores (village_id, overall_score, infrastructure_score, completion_rate_score, social_indicators_score, feedback_score, fund_utilization_score, is_adarsh_candidate, score_breakdown) VALUES
      ($1, 65.5, 60, 50, 67.5, 70, 80, false, '{"infrastructure": 60, "completion_rate": 50, "social_indicators": 67.5, "feedback": 70, "fund_utilization": 80}')
    `, [rampurId]);
        console.log('Adarsh scores created');

        // Employee Assignment
        const employee = await client.query("SELECT id FROM users WHERE username = 'employee1'");
        const employeeId = employee.rows[0].id;

        await client.query(`
      INSERT INTO employee_villages (employee_id, village_id) VALUES ($1, $2)
    `, [employeeId, rampurId]);
        console.log('Employee assigned');

        await client.query('COMMIT');
        console.log('Seed completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Seed failed:', error);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
