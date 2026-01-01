import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { updateAdarshScore } from '../services/adarshScoreService';

const router = express.Router();

// Get all villages with filters
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { state, district, adarsh_candidate, employee_id } = req.query;
    const user = req.user!;

    let query = `
      SELECT 
        v.*,
        COALESCE(a.overall_score, 0) as adarsh_score,
        COALESCE(a.is_adarsh_candidate, false) as is_adarsh_candidate,
        ST_AsGeoJSON(v.geometry) as geometry_geojson
      FROM villages v
      LEFT JOIN adarsh_scores a ON a.village_id = v.id
      WHERE v.is_active = true
    `;
    const params: any[] = [];
    let paramCount = 1;

    // Employee can only see assigned villages
    if (user.role === 'employee') {
      query += ` AND EXISTS (
        SELECT 1 FROM employee_villages ev 
        WHERE ev.village_id = v.id AND ev.employee_id = $${paramCount}
      )`;
      params.push(user.userId);
      paramCount++;
    }

    if (state) {
      query += ` AND v.state = $${paramCount}`;
      params.push(state);
      paramCount++;
    }

    if (district) {
      query += ` AND v.district = $${paramCount}`;
      params.push(district);
      paramCount++;
    }

    if (adarsh_candidate === 'true') {
      query += ` AND a.is_adarsh_candidate = true`;
    }

    query += ' ORDER BY v.name';

    const result = await pool.query(query, params);

    // Parse GeoJSON
    const villages = result.rows.map((row: any) => ({
      ...row,
      geometry: row.geometry_geojson ? JSON.parse(row.geometry_geojson) : null,
      geometry_geojson: undefined,
    }));

    res.json(villages);
  } catch (error: any) {
    console.error('Get villages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single village with details and analytics
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    let query = `
      SELECT 
        v.*,
        COALESCE(a.overall_score, 0) as adarsh_score,
        COALESCE(a.is_adarsh_candidate, false) as is_adarsh_candidate,
        a.score_breakdown,
        ST_AsGeoJSON(v.geometry) as geometry_geojson
      FROM villages v
      LEFT JOIN adarsh_scores a ON a.village_id = v.id
      WHERE v.id = $1 AND v.is_active = true
    `;
    const params: any[] = [id];

    // Employee can only see assigned villages
    if (user.role === 'employee') {
      query += ` AND EXISTS (
        SELECT 1 FROM employee_villages ev 
        WHERE ev.village_id = v.id AND ev.employee_id = $2
      )`;
      params.push(user.userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Village not found' });
    }

    const village = result.rows[0];
    village.geometry = village.geometry_geojson ? JSON.parse(village.geometry_geojson) : null;
    village.geometry_geojson = undefined;

    // score_breakdown is stored as JSONB; node-postgres may already give an object.
    // Only parse when it's a string to avoid runtime errors.
    if (village.score_breakdown && typeof village.score_breakdown === 'string') {
      try {
        village.score_breakdown = JSON.parse(village.score_breakdown);
      } catch {
        village.score_breakdown = null;
      }
    }

    // --- Additional analytics & related data for Village Details page ---
    // Fund summary for this village
    const fundSummaryResult = await pool.query(
      `
      SELECT 
        COALESCE(SUM(p.allocated_amount), 0) as total_allocated,
        COALESCE(SUM(p.utilized_amount), 0) as total_utilized
      FROM projects p
      WHERE p.village_id = $1
      `,
      [id]
    );

    // Ongoing & completed projects with simple completion %
    const projectsResult = await pool.query(
      `
      SELECT 
        p.id,
        p.title,
        p.project_type,
        p.status,
        p.allocated_amount,
        p.utilized_amount,
        COUNT(DISTINCT c.id) as total_checkpoints,
        COUNT(DISTINCT CASE WHEN cs.status = 'approved' THEN c.id END) as approved_checkpoints
      FROM projects p
      LEFT JOIN checkpoints c ON c.project_id = p.id
      LEFT JOIN checkpoint_submissions cs 
        ON cs.checkpoint_id = c.id AND cs.status = 'approved'
      WHERE p.village_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
      `,
      [id]
    );

    const projects = projectsResult.rows.map((p: any) => {
      const total = Number(p.total_checkpoints || 0);
      const approved = Number(p.approved_checkpoints || 0);
      const completion_percent = total > 0 ? Math.round((approved / total) * 100) : 0;
      return { ...p, completion_percent };
    });

    // Recent submissions from volunteers for this village
    const submissionsResult = await pool.query(
      `
      SELECT 
        cs.id,
        cs.checkpoint_id,
        cs.status,
        cs.submitted_by,
        cs.submitted_at,
        cs.review_notes,
        cs.reviewed_by,
        cs.reviewed_at,
        c.name as checkpoint_name,
        p.id as project_id,
        p.title as project_title
      FROM checkpoint_submissions cs
      JOIN checkpoints c ON c.id = cs.checkpoint_id
      JOIN projects p ON p.id = c.project_id
      WHERE p.village_id = $1
      ORDER BY cs.submitted_at DESC
      LIMIT 10
      `,
      [id]
    );

    const fundSummary = fundSummaryResult.rows[0] || {
      total_allocated: 0,
      total_utilized: 0,
    };

    // Calculate what village lacks to reach Adarsh (pending work)
    const adarshScore = Number(village.adarsh_score || 0);
    const pendingWork = [];
    const breakdown = village.score_breakdown || {};

    if (adarshScore < 85) {
      const gap = 85 - adarshScore;
      if (breakdown.infrastructure < 70) {
        pendingWork.push({
          category: 'Infrastructure',
          current_score: breakdown.infrastructure || 0,
          target: 70,
          gap: 70 - (breakdown.infrastructure || 0),
          action: 'Improve infrastructure facilities (healthcare, schools, roads)'
        });
      }
      if (breakdown.completion_rate < 80) {
        pendingWork.push({
          category: 'Project Completion',
          current_score: breakdown.completion_rate || 0,
          target: 80,
          gap: 80 - (breakdown.completion_rate || 0),
          action: 'Complete pending projects and approve checkpoint submissions'
        });
      }
      if (breakdown.social_indicators < 75) {
        pendingWork.push({
          category: 'Social Indicators',
          current_score: breakdown.social_indicators || 0,
          target: 75,
          gap: 75 - (breakdown.social_indicators || 0),
          action: 'Improve literacy and employment rates'
        });
      }
      if (breakdown.feedback < 70) {
        pendingWork.push({
          category: 'Community Feedback',
          current_score: breakdown.feedback || 0,
          target: 70,
          gap: 70 - (breakdown.feedback || 0),
          action: 'Increase community engagement and approval rates'
        });
      }
      if (breakdown.fund_utilization < 80) {
        pendingWork.push({
          category: 'Fund Utilization',
          current_score: breakdown.fund_utilization || 0,
          target: 80,
          gap: 80 - (breakdown.fund_utilization || 0),
          action: 'Better utilize allocated funds for projects'
        });
      }
    }

    // Get citizen reviews from mobile app (submissions with client_id)
    const citizenReviewsResult = await pool.query(
      `
      SELECT 
        cs.id,
        cs.client_id,
        cs.submitted_by,
        cs.submitted_at,
        cs.status,
        cs.review_notes,
        c.name as checkpoint_name,
        p.title as project_title,
        p.id as project_id
      FROM checkpoint_submissions cs
      JOIN checkpoints c ON c.id = cs.checkpoint_id
      JOIN projects p ON p.id = c.project_id
      WHERE p.village_id = $1 AND cs.client_id IS NOT NULL
      ORDER BY cs.submitted_at DESC
      LIMIT 20
      `,
      [id]
    );

    // Get village priority votes (infrastructure requests)
    const priorityVotesResult = await pool.query(
      `
      SELECT 
        id,
        required_infrastructure,
        description,
        category,
        total_votes,
        is_volunteer,
        volunteer_id,
        employee_id,
        volunteer_id,
        employee_id,
        submitted_at,
        status,
        verification_notes
      FROM village_priority_votes
      WHERE village_id = $1 AND status != 'converted'
      ORDER BY total_votes DESC, submitted_at DESC
      `,
      [id]
    );

    res.json({
      ...village,
      fund_summary: fundSummary,
      projects,
      recent_submissions: submissionsResult.rows,
      pending_work: pendingWork,
      citizen_reviews: citizenReviewsResult.rows,
      priority_votes: priorityVotesResult.rows,
      adarsh_gap: adarshScore < 85 ? 85 - adarshScore : 0,
    });
  } catch (error: any) {
    console.error('Get village error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create village (Officer only)
router.post('/', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const {
      name,
      state,
      district,
      block,
      population,
      latitude,
      longitude,
      geometry,
      baseline_metrics,
    } = req.body;

    if (!name || !state || !district) {
      return res.status(400).json({ error: 'Name, state, and district are required' });
    }

    let geometryClause = 'NULL';
    if (geometry && geometry.type === 'Polygon' && geometry.coordinates) {
      const geomText = JSON.stringify(geometry);
      geometryClause = `ST_GeogFromText('POLYGON((${geometry.coordinates[0].map((c: number[]) => `${c[0]} ${c[1]}`).join(', ')}))')`;
    }

    const result = await pool.query(
      `INSERT INTO villages (name, state, district, block, population, latitude, longitude, geometry, baseline_metrics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, ${geometryClause === 'NULL' ? 'NULL' : geometryClause}, $8)
       RETURNING id`,
      [name, state, district, block || null, population || null, latitude || null, longitude || null, JSON.stringify(baseline_metrics || {})]
    );

    const villageId = result.rows[0].id;

    // Calculate initial Adarsh score
    await updateAdarshScore(villageId).catch(console.error);

    // Return full village including geometry & adarsh fields for immediate map update
    const detailsResult = await pool.query(
      `
      SELECT 
        v.*,
        COALESCE(a.overall_score, 0) as adarsh_score,
        COALESCE(a.is_adarsh_candidate, false) as is_adarsh_candidate,
        ST_AsGeoJSON(v.geometry) as geometry_geojson
      FROM villages v
      LEFT JOIN adarsh_scores a ON a.village_id = v.id
      WHERE v.id = $1
      `,
      [villageId]
    );

    const village = detailsResult.rows[0];
    village.geometry = village.geometry_geojson ? JSON.parse(village.geometry_geojson) : null;
    village.geometry_geojson = undefined;

    res.status(201).json({ message: 'Village created successfully', village });
  } catch (error: any) {
    console.error('Create village error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update village (Officer only)
router.put('/:id', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      state,
      district,
      block,
      population,
      latitude,
      longitude,
      geometry,
      baseline_metrics,
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      params.push(name);
    }
    if (state) {
      updates.push(`state = $${paramCount++}`);
      params.push(state);
    }
    if (district) {
      updates.push(`district = $${paramCount++}`);
      params.push(district);
    }
    if (block !== undefined) {
      updates.push(`block = $${paramCount++}`);
      params.push(block);
    }
    if (population !== undefined) {
      updates.push(`population = $${paramCount++}`);
      params.push(population);
    }
    if (latitude !== undefined) {
      updates.push(`latitude = $${paramCount++}`);
      params.push(latitude);
    }
    if (longitude !== undefined) {
      updates.push(`longitude = $${paramCount++}`);
      params.push(longitude);
    }
    if (baseline_metrics) {
      updates.push(`baseline_metrics = $${paramCount++}`);
      params.push(JSON.stringify(baseline_metrics));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const query = `UPDATE villages SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Village not found' });
    }

    // Recalculate Adarsh score if baseline metrics changed
    if (baseline_metrics) {
      await updateAdarshScore(parseInt(id)).catch(console.error);
    }

    res.json({ message: 'Village updated successfully', village: result.rows[0] });
  } catch (error: any) {
    console.error('Update village error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Soft delete village (Officer only)
// We follow the existing convention of using the is_active flag instead of hard-deleting rows.
// This keeps related projects/checkpoints intact while hiding the village from normal listings.
router.delete('/:id', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // First check village exists and is currently active
    const existing = await pool.query(
      'SELECT id, name, is_active FROM villages WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Village not found' });
    }

    if (!existing.rows[0].is_active) {
      return res.status(400).json({ error: 'Village is already inactive' });
    }

    await pool.query(
      'UPDATE villages SET is_active = false WHERE id = $1',
      [id]
    );

    res.json({ message: 'Village deleted (soft-deleted) successfully' });
  } catch (error: any) {
    console.error('Delete village error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
