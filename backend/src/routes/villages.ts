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

// Get single village with details
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
    village.score_breakdown = village.score_breakdown ? JSON.parse(village.score_breakdown) : null;

    res.json(village);
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
       RETURNING id, name, state, district`,
      [name, state, district, block || null, population || null, latitude || null, longitude || null, JSON.stringify(baseline_metrics || {})]
    );

    const villageId = result.rows[0].id;

    // Calculate initial Adarsh score
    await updateAdarshScore(villageId).catch(console.error);

    res.status(201).json({ message: 'Village created successfully', village: result.rows[0] });
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

export default router;
