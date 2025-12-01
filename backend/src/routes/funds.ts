import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Allocate/release funds (Officer only)
router.post('/allocate', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const { project_id, amount, description } = req.body;

    if (!project_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Project ID and valid amount are required' });
    }

    // Get current project allocation
    const projectResult = await pool.query(
      'SELECT allocated_amount, utilized_amount FROM projects WHERE id = $1',
      [project_id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];
    const newAllocatedAmount = parseFloat(project.allocated_amount) + parseFloat(amount.toString());

    // Update project allocation
    await pool.query(
      'UPDATE projects SET allocated_amount = $1 WHERE id = $2',
      [newAllocatedAmount, project_id]
    );

    // Record transaction
    await pool.query(
      `INSERT INTO fund_transactions (project_id, transaction_type, amount, description, approved_by, created_by)
       VALUES ($1, 'allocation', $2, $3, $4, $4)`,
      [project_id, amount, description || 'Additional fund allocation', req.user!.userId]
    );

    res.json({ message: 'Funds allocated successfully' });
  } catch (error: any) {
    console.error('Allocate funds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/release', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const { project_id, amount, description } = req.body;

    if (!project_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Project ID and valid amount are required' });
    }

    // Get current project status
    const projectResult = await pool.query(
      'SELECT allocated_amount, utilized_amount FROM projects WHERE id = $1',
      [project_id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];
    const newUtilizedAmount = parseFloat(project.utilized_amount) + parseFloat(amount.toString());

    if (newUtilizedAmount > parseFloat(project.allocated_amount)) {
      return res.status(400).json({ error: 'Utilized amount cannot exceed allocated amount' });
    }

    // Update project utilization
    await pool.query(
      'UPDATE projects SET utilized_amount = $1 WHERE id = $2',
      [newUtilizedAmount, project_id]
    );

    // Record transaction
    await pool.query(
      `INSERT INTO fund_transactions (project_id, transaction_type, amount, description, approved_by, created_by)
       VALUES ($1, 'release', $2, $3, $4, $4)`,
      [project_id, amount, description || 'Fund release', req.user!.userId]
    );

    res.json({ message: 'Funds released successfully' });
  } catch (error: any) {
    console.error('Release funds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
