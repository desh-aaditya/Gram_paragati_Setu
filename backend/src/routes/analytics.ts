import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { state, district, from, to, project_type } = req.query;
    let whereConditions: string[] = ['v.is_active = true'];
    let params: any[] = [];
    let paramIndex = 1;

    // Employee sees only assigned villages
    if (user.role === 'employee') {
      whereConditions.push(`v.id IN (
        SELECT village_id FROM employee_villages WHERE employee_id = $${paramIndex++}
      )`);
      params.push(user.userId);
    }

    // Apply filters
    if (state) {
      whereConditions.push(`v.state = $${paramIndex++}`);
      params.push(state);
    }
    if (district) {
      whereConditions.push(`v.district ILIKE $${paramIndex++}`); // ILIKE for case-insensitive search
      params.push(`%${district}%`);
    }
    if (req.query.village_id) {
      whereConditions.push(`v.id = $${paramIndex++}`);
      params.push(req.query.village_id);
    }
    // Note: project_type filter applies to projects, so it might need special handling or join
    // For simplicity in main dashboard stats, we'll apply it where 'projects' table is involved

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Fund summary
    // Needs project type and date filter logic specifically for funds/projects
    let projectWhere = whereClause;
    let projectParams = [...params];
    let projectParamIndex = paramIndex;

    if (project_type) {
      projectWhere += ` AND p.project_type = $${projectParamIndex++}`;
      projectParams.push(project_type);
    }
    // Date filter usually applies to project start/end or creation? Or fund transaction date?
    // Let's assume for dashboard summary we filter projects created within range if dates provided
    if (from) {
      projectWhere += ` AND p.created_at >= $${projectParamIndex++}`;
      projectParams.push(from);
    }
    if (to) {
      projectWhere += ` AND p.created_at <= $${projectParamIndex++}`;
      projectParams.push(to);
    }

    const fundResult = await pool.query(`
      SELECT 
        COALESCE(SUM(p.allocated_amount), 0) as total_allocated,
        COALESCE(SUM(p.utilized_amount), 0) as total_utilized,
        COUNT(*) as total_projects,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects
      FROM projects p
      JOIN villages v ON v.id = p.village_id
      ${projectWhere}
    `, projectParams);

    // Village statistics - applies strict village filters (state/district)
    const villageResult = await pool.query(`
      SELECT 
        COUNT(*) as total_villages,
        COUNT(CASE WHEN a.is_adarsh_candidate = true THEN 1 END) as adarsh_candidates,
        COALESCE(AVG(a.overall_score), 0) as avg_score
      FROM villages v
      LEFT JOIN adarsh_scores a ON a.village_id = v.id
      ${whereClause}
    `, params);

    // Pending submissions - applies village filters + date maybe?
    // Let's stick to village filters for now for submissions count
    const submissionResult = await pool.query(`
      SELECT COUNT(*) as pending_submissions
      FROM checkpoint_submissions cs
      JOIN checkpoints c ON c.id = cs.checkpoint_id
      JOIN projects p ON p.id = c.project_id
      JOIN villages v ON v.id = p.village_id
      WHERE cs.status = 'pending' AND ${whereConditions.join(' AND ')}
    `, params);

    // Recent activity - applies filters
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
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY cs.submitted_at DESC
      LIMIT 10
    `, params);

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

// Get Adarsh score distribution
router.get('/adarsh-distribution', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { state, district } = req.query;

    let whereConditions: string[] = ['v.is_active = true'];
    let params: any[] = [];
    let paramIndex = 1;

    if (user.role === 'employee') {
      whereConditions.push(`v.id IN (
        SELECT village_id FROM employee_villages WHERE employee_id = $${paramIndex++}
      )`);
      params.push(user.userId);
    }

    if (state) {
      whereConditions.push(`v.state = $${paramIndex++}`);
      params.push(state);
    }
    if (district) {
      whereConditions.push(`v.district ILIKE $${paramIndex++}`);
      params.push(`%${district}%`);
    }
    if (req.query.village_id) {
      whereConditions.push(`v.id = $${paramIndex++}`);
      params.push(req.query.village_id);
    }

    const query = `
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
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY score_category 
      ORDER BY MIN(overall_score) DESC
    `;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get Adarsh distribution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Village-level analytics
router.get('/village/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const basic = await pool.query(
      `SELECT 
        v.id,
        v.name,
        v.state,
        v.district,
        v.block,
        COALESCE(a.overall_score, 0) as adarsh_score,
        a.score_breakdown,
        a.is_adarsh_candidate
      FROM villages v
      LEFT JOIN adarsh_scores a ON a.village_id = v.id
      WHERE v.id = $1 AND v.is_active = true`,
      [id]
    );

    if (basic.rows.length === 0) {
      return res.status(404).json({ error: 'Village not found' });
    }

    const fundTrend = await pool.query(
      `SELECT 
        DATE_TRUNC('month', ft.created_at) as period,
        SUM(CASE WHEN ft.transaction_type = 'allocation' THEN ft.amount ELSE 0 END) as allocated,
        SUM(CASE WHEN ft.transaction_type = 'release' THEN ft.amount ELSE 0 END) as utilized
      FROM fund_transactions ft
      JOIN projects p ON p.id = ft.project_id
      WHERE p.village_id = $1
      GROUP BY DATE_TRUNC('month', ft.created_at)
      ORDER BY period`,
      [id]
    );

    const projectAgg = await pool.query(
      `SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_projects
      FROM projects
      WHERE village_id = $1`,
      [id]
    );

    res.json({
      village: basic.rows[0],
      fund_trend: fundTrend.rows,
      projects: projectAgg.rows[0],
    });
  } catch (error: any) {
    console.error('Get village analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// State / district level overview
router.get('/state', authenticate, async (req: AuthRequest, res) => {
  try {
    const { state, district, from, to } = req.query;

    const baseWhereParts: string[] = ['v.is_active = true'];
    const baseParams: any[] = [];
    let baseIndex = 1;

    if (state) {
      baseWhereParts.push(`v.state = $${baseIndex++}`);
      baseParams.push(state);
    }
    if (district) {
      baseWhereParts.push(`v.district ILIKE $${baseIndex++}`);
      baseParams.push(`%${district}%`);
    }
    if (req.query.village_id) {
      baseWhereParts.push(`v.id = $${baseIndex++}`);
      baseParams.push(req.query.village_id);
    }

    const summaryQuery = `
      SELECT 
        v.state,
        v.district,
        COUNT(DISTINCT v.id) as total_villages,
        COUNT(DISTINCT CASE WHEN a.is_adarsh_candidate THEN v.id END) as adarsh_villages,
        COALESCE(AVG(a.overall_score), 0) as avg_score
      FROM villages v
      LEFT JOIN adarsh_scores a ON a.village_id = v.id
      WHERE ${baseWhereParts.join(' AND ')}
      GROUP BY v.state, v.district
      ORDER BY v.state, v.district
    `;

    const summary = await pool.query(summaryQuery, baseParams);

    const fundsWhereParts = [...baseWhereParts];
    const fundParams = [...baseParams];
    let fundIndex = fundParams.length + 1;

    if (from) {
      fundsWhereParts.push(`ft.created_at >= $${fundIndex++}`);
      fundParams.push(from);
    }

    if (to) {
      fundsWhereParts.push(`ft.created_at <= $${fundIndex++}`);
      fundParams.push(to);
    }

    const fundsQuery = `
      SELECT 
        v.state,
        v.district,
        SUM(CASE WHEN ft.transaction_type = 'allocation' THEN ft.amount ELSE 0 END) as allocated,
        SUM(CASE WHEN ft.transaction_type = 'release' THEN ft.amount ELSE 0 END) as utilized
      FROM fund_transactions ft
      JOIN projects p ON p.id = ft.project_id
      JOIN villages v ON v.id = p.village_id
      WHERE ${fundsWhereParts.join(' AND ')}
      GROUP BY v.state, v.district
      ORDER BY v.state, v.district
    `;

    const funds = await pool.query(fundsQuery, fundParams);

    res.json({
      summary: summary.rows,
      funds: funds.rows,
    });
  } catch (error: any) {
    console.error('Get state analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Project-level analytics
router.get('/projects', authenticate, async (req: AuthRequest, res) => {
  try {
    const { project_type } = req.query;

    let where = 'v.is_active = true';
    const params: any[] = [];
    let paramCount = 1;

    if (project_type) {
      where += ` AND p.project_type = $${paramCount}`;
      params.push(project_type);
      paramCount++;
    }

    const projectAgg = await pool.query(
      `SELECT 
        p.project_type,
        COUNT(*) as total_projects,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN p.status = 'in_progress' THEN 1 END) as in_progress_projects,
        COALESCE(SUM(p.allocated_amount), 0) as total_allocated,
        COALESCE(SUM(p.utilized_amount), 0) as total_utilized
      FROM projects p
      JOIN villages v ON v.id = p.village_id
      WHERE ${where}
      GROUP BY p.project_type
      ORDER BY p.project_type`,
      params
    );

    const checkpointsAgg = await pool.query(
      `SELECT 
        COUNT(*) as total_checkpoints,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_checkpoints,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_checkpoints,
        COUNT(CASE WHEN media_count > 0 THEN 1 END) as checkpoints_with_media
      FROM (
        SELECT 
          c.id,
          (SELECT status FROM checkpoint_submissions WHERE checkpoint_id = c.id ORDER BY submitted_at DESC LIMIT 1) as status,
          (SELECT COUNT(*) FROM media m JOIN checkpoint_submissions cs ON cs.id = m.submission_id WHERE cs.checkpoint_id = c.id) as media_count
        FROM checkpoints c
      ) derived_checkpoints`,
      []
    );

    res.json({
      projects_by_type: projectAgg.rows,
      checkpoints: checkpointsAgg.rows[0],
    });
  } catch (error: any) {
    console.error('Get project analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
