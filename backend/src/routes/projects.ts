import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { updateAdarshScore } from '../services/adarshScoreService';

const router = express.Router();

// Get projects (filtered by village if employee)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { village_id } = req.query;
    const user = req.user!;

    let query = `
      SELECT p.*, v.name as village_name
      FROM projects p
      JOIN villages v ON v.id = p.village_id
      WHERE v.is_active = true
    `;
    const params: any[] = [];
    let paramCount = 1;

    // Employee can only see projects in assigned villages
    if (user.role === 'employee') {
      query += ` AND EXISTS (
        SELECT 1 FROM employee_villages ev 
        WHERE ev.village_id = v.id AND ev.employee_id = $${paramCount}
      )`;
      params.push(user.userId);
      paramCount++;
    }

    if (village_id) {
      query += ` AND p.village_id = $${paramCount}`;
      params.push(village_id);
      paramCount++;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single project with checkpoints
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Get project
    let projectQuery = `
      SELECT p.*, v.name as village_name
      FROM projects p
      JOIN villages v ON v.id = p.village_id
      WHERE p.id = $1 AND v.is_active = true
    `;
    const params: any[] = [id];

    if (user.role === 'employee') {
      projectQuery += ` AND EXISTS (
        SELECT 1 FROM employee_villages ev 
        WHERE ev.village_id = v.id AND ev.employee_id = $2
      )`;
      params.push(user.userId);
    }

    const projectResult = await pool.query(projectQuery, params);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Get checkpoints with submissions
    const checkpointsResult = await pool.query(
      `SELECT 
        c.*,
        COUNT(cs.id) as submission_count,
        COUNT(CASE WHEN cs.status = 'approved' THEN 1 END) as approved_count
      FROM checkpoints c
      LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = c.id
      WHERE c.project_id = $1
      GROUP BY c.id
      ORDER BY c.checkpoint_order`,
      [id]
    );

    project.checkpoints = checkpointsResult.rows;

    res.json(project);
  } catch (error: any) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project (Officer only)
router.post('/', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const {
      village_id,
      title,
      description,
      project_type,
      allocated_amount,
      start_date,
      end_date,
    } = req.body;

    if (!village_id || !title || !allocated_amount) {
      return res.status(400).json({ error: 'Village ID, title, and allocated amount are required' });
    }

    const result = await pool.query(
      `INSERT INTO projects (village_id, title, description, project_type, allocated_amount, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [village_id, title, description, project_type, allocated_amount, start_date, end_date, req.user!.userId]
    );

    // Record fund allocation
    await pool.query(
      `INSERT INTO fund_transactions (project_id, transaction_type, amount, description, approved_by, created_by)
       VALUES ($1, 'allocation', $2, 'Initial fund allocation for project', $3, $3)`,
      [result.rows[0].id, allocated_amount, req.user!.userId]
    );

    // Recalculate Adarsh score
    await updateAdarshScore(village_id).catch(console.error);

    res.status(201).json({ message: 'Project created successfully', project: result.rows[0] });
  } catch (error: any) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add checkpoint to project
router.post('/:id/checkpoints', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, checkpoint_order, is_mandatory, estimated_date } = req.body;

    if (!name || checkpoint_order === undefined) {
      return res.status(400).json({ error: 'Name and checkpoint order are required' });
    }

    const result = await pool.query(
      `INSERT INTO checkpoints (project_id, name, description, checkpoint_order, is_mandatory, estimated_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, name, description, checkpoint_order, is_mandatory !== false, estimated_date]
    );

    res.status(201).json({ message: 'Checkpoint created successfully', checkpoint: result.rows[0] });
  } catch (error: any) {
    console.error('Create checkpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
