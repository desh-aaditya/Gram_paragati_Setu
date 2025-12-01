import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let villageFilter = '';

    // Employee sees only assigned villages
    if (user.role === 'employee') {
      villageFilter = `AND v.id IN (
        SELECT village_id FROM employee_villages WHERE employee_id = ${user.userId}
      )`;
    }

    // Fund summary
    const fundResult = await pool.query(`
      SELECT 
        COALESCE(SUM(p.allocated_amount), 0) as total_allocated,
        COALESCE(SUM(p.utilized_amount), 0) as total_utilized,
        COUNT(*) as total_projects,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects
      FROM projects p
      JOIN villages v ON v.id = p.village_id
      WHERE v.is_active = true ${villageFilter}
    `);

    // Village statistics
    const villageResult = await pool.query(`
      SELECT 
        COUNT(*) as total_villages,
        COUNT(CASE WHEN a.is_adarsh_candidate = true THEN 1 END) as adarsh_candidates,
        COALESCE(AVG(a.overall_score), 0) as avg_score
      FROM villages v
      LEFT JOIN adarsh_scores a ON a.village_id = v.id
      WHERE v.is_active = true ${villageFilter}
    `);

    // Pending submissions
    const submissionResult = await pool.query(`
      SELECT COUNT(*) as pending_submissions
      FROM checkpoint_submissions cs
      JOIN checkpoints c ON c.id = cs.checkpoint_id
      JOIN projects p ON p.id = c.project_id
      JOIN villages v ON v.id = p.village_id
      WHERE cs.status = 'pending' AND v.is_active = true ${villageFilter}
    `);

    // Recent activity
    const activityResult = await pool.query(`
      SELECT 
        'submission' as type,
        cs.submitted_at as timestamp,
        v.name as village_name,
        p.title as project_title
      FROM checkpoint_submissions cs
      JOIN checkpoints c ON c.id = cs.checkpoint_id
      JOIN projects p ON p.id = c.project_id
      JOIN villages v ON v.id = p.village_id
      WHERE v.is_active = true ${villageFilter}
      ORDER BY cs.submitted_at DESC
      LIMIT 10
    `);

    res.json({
      funds: fundResult.rows[0],
      villages: villageResult.rows[0],
      pending_submissions: submissionResult.rows[0].pending_submissions,
      recent_activity: activityResult.rows,
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get fund history
router.get('/funds', authenticate, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;
    const user = req.user!;

    let query = `
      SELECT 
        ft.*,
        p.title as project_title,
        v.name as village_name,
        u.full_name as approved_by_name
      FROM fund_transactions ft
      JOIN projects p ON p.id = ft.project_id
      JOIN villages v ON v.id = p.village_id
      JOIN users u ON u.id = ft.approved_by
      WHERE v.is_active = true
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (user.role === 'employee') {
      query += ` AND v.id IN (
        SELECT village_id FROM employee_villages WHERE employee_id = $${paramCount}
      )`;
      params.push(user.userId);
      paramCount++;
    }

    if (start_date) {
      query += ` AND ft.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND ft.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY ft.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get fund history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Adarsh score distribution
router.get('/adarsh-distribution', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    let query = `
      SELECT 
        CASE 
          WHEN overall_score >= 85 THEN 'Adarsh (85+)'
          WHEN overall_score >= 70 THEN 'Good (70-84)'
          WHEN overall_score >= 50 THEN 'Average (50-69)'
          ELSE 'Below Average (<50)'
        END as score_category,
        COUNT(*) as village_count
      FROM adarsh_scores a
      JOIN villages v ON v.id = a.village_id
      WHERE v.is_active = true
    `;

    if (user.role === 'employee') {
      query += ` AND v.id IN (
        SELECT village_id FROM employee_villages WHERE employee_id = $1
      )`;
    }

    query += ' GROUP BY score_category ORDER BY MIN(overall_score) DESC';

    const params = user.role === 'employee' ? [user.userId] : [];
    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get Adarsh distribution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
