import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { updateAdarshScore } from '../services/adarshScoreService';
import { v4 as uuidv4 } from 'uuid';

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
        COALESCE(COUNT(cs.id), 0)::int as submission_count,
        COALESCE(COUNT(CASE WHEN cs.status = 'approved' THEN 1 END), 0)::int as approved_count
      FROM checkpoints c
      LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = c.id
      WHERE c.project_id = $1
      GROUP BY c.id
      ORDER BY c.sequence_order`,
      [id]
    );

    project.checkpoints = checkpointsResult.rows;

    // Calculate completion percentage based on checkpoints
    // A checkpoint is considered complete if it has at least one approved submission
    const totalCheckpoints = checkpointsResult.rows.length;
    const completedCheckpoints = checkpointsResult.rows.filter(
      (c: any) => Number(c.approved_count || 0) > 0
    ).length;
    const completionPercentage = totalCheckpoints > 0
      ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
      : 0;

    project.completion_percentage = completionPercentage;
    project.total_checkpoints = totalCheckpoints;
    project.completed_checkpoints = completedCheckpoints;

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
      from_vote_id,
    } = req.body;

    if (!village_id || !title || !allocated_amount) {
      return res.status(400).json({ error: 'Village ID, title, and allocated amount are required' });
    }

    const result = await pool.query(
      `INSERT INTO projects (village_id, title, description, project_type, allocated_amount, start_date, end_date, public_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [village_id, title, description, project_type, allocated_amount, start_date, end_date, uuidv4()]
    );

    // If created from a priority vote, mark the vote as converted
    if (from_vote_id) {
      await pool.query(
        `UPDATE village_priority_votes SET status = 'converted' WHERE id = $1`,
        [from_vote_id]
      );
    }

    // Record fund allocation
    await pool.query(
      `INSERT INTO fund_transactions (project_id, transaction_type, amount, description)
       VALUES ($1, 'allocation', $2, 'Initial fund allocation for project')`,
      [result.rows[0].id, allocated_amount]
    );

    // Recalculate Adarsh score
    await updateAdarshScore(village_id).catch(console.error);

    res.status(201).json({ message: 'Project created successfully', project: result.rows[0] });
  } catch (error: any) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project (Officer only)
router.put('/:id', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      project_type,
      allocated_amount,
      start_date,
      end_date,
      status
    } = req.body;

    const result = await pool.query(
      `UPDATE projects 
       SET title = $1, description = $2, project_type = $3, allocated_amount = $4, start_date = $5, end_date = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [title, description, project_type, allocated_amount, start_date, end_date, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Recalculate Adarsh score since amount/status might have changed
    await updateAdarshScore(result.rows[0].village_id).catch(console.error);

    res.json({ message: 'Project updated successfully', project: result.rows[0] });
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add checkpoint to project
router.post('/:id/checkpoints', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, sequence_order, is_mandatory, estimated_date } = req.body;

    if (!name || sequence_order === undefined) {
      return res.status(400).json({ error: 'Name and sequence order are required' });
    }

    const result = await pool.query(
      `INSERT INTO checkpoints (project_id, name, description, sequence_order, is_mandatory, estimated_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, name, description, sequence_order, is_mandatory !== undefined ? is_mandatory : true, estimated_date || null]
    );

    res.status(201).json({ message: 'Checkpoint created successfully', checkpoint: result.rows[0] });
  } catch (error: any) {
    console.error('Create checkpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project (Officer only)
router.delete('/:id', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Check if project exists
    const checkQuery = 'SELECT * FROM projects WHERE id = $1';
    const checkResult = await client.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = checkResult.rows[0];

    await client.query('BEGIN');

    // 1. Delete checkpoint submissions (linked to checkpoints)
    // First get checkpoint IDs
    const checkpointsResult = await client.query('SELECT id FROM checkpoints WHERE project_id = $1', [id]);
    const checkpointIds = checkpointsResult.rows.map(r => r.id);

    if (checkpointIds.length > 0) {
      // Delete submissions for these checkpoints
      await client.query('DELETE FROM checkpoint_submissions WHERE checkpoint_id = ANY($1)', [checkpointIds]);
    }

    // 2. Delete checkpoints
    await client.query('DELETE FROM checkpoints WHERE project_id = $1', [id]);

    // 3. Delete fund transactions
    await client.query('DELETE FROM fund_transactions WHERE project_id = $1', [id]);

    // 4. Delete the project itself
    await client.query('DELETE FROM projects WHERE id = $1', [id]);

    await client.query('COMMIT');

    // Recalculate Adarsh score for the village (outside transaction is fine, or inside)
    // We'll do it after to ensure consistency if it fails it doesn't rollback the delete
    await updateAdarshScore(project.village_id).catch(console.error);

    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Delete project error:', error);
    // Send a more specific error if possible, e.g. foreign key violation
    if (error.code === '23503') {
      res.status(400).json({ error: 'Cannot delete project because it has related records that could not be automatically removed.' });
    } else {
      res.status(500).json({ error: 'Internal server error during deletion' });
    }
  } finally {
    client.release();
  }
});

export default router;
