import pool from '../src/config/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Starting seed...');
    await client.query('BEGIN');

    // Clear existing data
    console.log('Clearing data...');
    await client.query('DELETE FROM media');
    await client.query('DELETE FROM checkpoint_submissions');
    await client.query('DELETE FROM checkpoints');
    await client.query('DELETE FROM fund_transactions');
    await client.query('DELETE FROM projects');
    await client.query('DELETE FROM adarsh_scores');
    await client.query('DELETE FROM employee_villages');
    await client.query('DELETE FROM village_priority_votes');
    await client.query('DELETE FROM villages');
    await client.query('DELETE FROM volunteers');
    await client.query('DELETE FROM users');
    console.log('Data cleared.');

    // Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);

    // Note: users table only allows 'officer' and 'employee' roles
    const users = await client.query(`
      INSERT INTO users (username, email, password_hash, role, full_name, department) VALUES
      ('officer1', 'officer1@gramsetu.gov.in', $2, 'officer', 'Rajesh Kumar', 'Rural Development'),
      ('employee1', 'employee1@gramsetu.gov.in', $1, 'employee', 'Suresh Singh', 'Field Operations')
      RETURNING id, username
    `, [passwordHash, adminHash]);

    const employee1Id = users.rows.find(u => u.username === 'employee1')?.id;

    // Villages
    const villages = await client.query(`
      INSERT INTO villages (name, state, district, block, population, latitude, longitude, is_active, baseline_metrics) VALUES
      ('Rampur', 'Uttar Pradesh', 'Lucknow', 'Bakshi Ka Talab', 2500, 26.9876, 80.9876, true, '{"infrastructure_score": 60, "healthcare_facilities": 2, "schools": 3, "literacy_rate": 75, "employment_rate": 60}'),
      ('Aliganj', 'Uttar Pradesh', 'Lucknow', 'Lucknow City', 5000, 26.8467, 80.9462, true, '{"infrastructure_score": 80, "healthcare_facilities": 5, "schools": 10, "literacy_rate": 85, "employment_rate": 75}'),
      ('Sonpur', 'Bihar', 'Saran', 'Sonpur', 3000, 25.6987, 85.1234, true, '{"infrastructure_score": 50, "healthcare_facilities": 1, "schools": 2, "literacy_rate": 65, "employment_rate": 55}'),
      ('Madhopur', 'Rajasthan', 'Jaipur', 'Sanganer', 1800, 26.8765, 75.7654, true, '{"infrastructure_score": 70, "healthcare_facilities": 3, "schools": 4, "literacy_rate": 80, "employment_rate": 70}')
    RETURNING id`);

    const rampurId = villages.rows[0].id;
    const aliganjId = villages.rows[1].id;
    const sonpurId = villages.rows[2].id;
    const madhopurId = villages.rows[3].id;

    console.log('IDs:', { rampurId, sonpurId, madhopurId });
    if (!rampurId || !sonpurId || !madhopurId) {
      throw new Error('One of the village IDs is missing!');
    }

    // Projects
    const projects = await client.query(`
      INSERT INTO projects (village_id, title, description, project_type, status, allocated_amount, utilized_amount, start_date, end_date, public_token) VALUES
      ($1, 'Road Construction', 'Building main road connecting to highway', 'infrastructure', 'in_progress', 500000, 200000, '2023-01-01', '2023-12-31', '${uuidv4()}'),
      ($1, 'School Renovation', 'Renovating primary school building', 'education', 'planned', 200000, 0, '2023-06-01', '2023-09-30', '${uuidv4()}'),
      ($2, 'Health Center', 'New community health center', 'healthcare', 'completed', 800000, 780000, '2022-01-01', '2022-12-31', '${uuidv4()}'),
      ($3, 'Relief Hospital', 'New multi-specialty hospital', 'healthcare', 'planned', 1000000, 0, '2024-01-01', '2024-12-31', '8a3c1f5a-61a1-43a1-9288-4f40cce6fa75')
    RETURNING id`, [rampurId, sonpurId, madhopurId]);

    const roadProjectId = projects.rows[0].id;

    // Checkpoints
    await client.query(`
      INSERT INTO checkpoints (project_id, name, description, sequence_order) VALUES
      ($1, 'Foundation Laid', 'Initial foundation work completed', 1),
      ($1, 'Base Layer', 'Gravel base layer laid', 2),
      ($1, 'Tarring', 'Final tarring of the road', 3)
    `, [roadProjectId]);

    // Adarsh Scores (Initial)
    await client.query(`
      INSERT INTO adarsh_scores (village_id, overall_score, infrastructure_score, completion_rate_score, social_indicators_score, feedback_score, fund_utilization_score, is_adarsh_candidate, score_breakdown) VALUES
      ($1, 65.5, 60, 50, 67.5, 70, 80, false, '{"infrastructure": 60, "completion_rate": 50, "social_indicators": 67.5, "feedback": 70, "fund_utilization": 80}'),
      ($2, 82.0, 85, 75, 80, 85, 90, true, '{"infrastructure": 85, "completion_rate": 75, "social_indicators": 80, "feedback": 85, "fund_utilization": 90}'),
      ($3, 72.0, 70, 80, 70, 60, 90, false, '{"infrastructure": 70, "completion_rate": 80, "social_indicators": 70, "feedback": 60, "fund_utilization": 90}')
    `, [rampurId, aliganjId, sonpurId]);

    // Employee Assignment
    await client.query(`
      INSERT INTO employee_villages (employee_id, village_id)
      VALUES ($1, $2)
    `, [employee1Id, rampurId]);

    // Volunteers
    await client.query(`
      INSERT INTO volunteers (username, password_hash, full_name, phone, email, employee_id, assigned_villages, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      'volunteer1',
      passwordHash,
      'Amit Patel',
      '+91-9876543210',
      'volunteer1@gramsetu.gov.in',
      employee1Id,
      [rampurId],
      true
    ]);

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
