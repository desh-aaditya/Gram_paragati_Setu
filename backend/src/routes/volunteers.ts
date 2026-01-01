import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { hashPassword, comparePassword } from '../config/auth';

const router = express.Router();

// Get all volunteers for the logged-in employee
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    
    // Employees can only see volunteers they created
    // Officers can see all volunteers
    let query = `
      SELECT 
        v.id, v.username, v.full_name, v.phone, v.email, 
        v.employee_id, v.assigned_villages, v.is_active,
        v.created_at, v.updated_at,
        u.full_name as employee_name
      FROM volunteers v
      LEFT JOIN users u ON u.id = v.employee_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (user.role === 'employee') {
      query += ` AND v.employee_id = $${paramCount}`;
      params.push(user.userId);
      paramCount++;
    }

    query += ' ORDER BY v.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get volunteers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create volunteer (Employee or Officer)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { username, password, full_name, phone, email, village_ids } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'Username, password, and full name are required' });
    }

    // Check if username already exists
    const existingResult = await pool.query(
      'SELECT id FROM volunteers WHERE username = $1',
      [username]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const passwordHash = await hashPassword(password);

    // Employees can only create volunteers for themselves
    // Officers can create volunteers for any employee
    const employeeId = user.role === 'employee' ? user.userId : req.body.employee_id || user.userId;

    const result = await pool.query(
      `INSERT INTO volunteers (username, password_hash, full_name, phone, email, employee_id, assigned_villages)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, full_name, phone, email, employee_id, assigned_villages, is_active, created_at`,
      [
        username,
        passwordHash,
        full_name,
        phone || null,
        email || null,
        employeeId,
        village_ids && Array.isArray(village_ids) ? village_ids : []
      ]
    );

    res.status(201).json({ 
      message: 'Volunteer created successfully', 
      volunteer: result.rows[0] 
    });
  } catch (error: any) {
    console.error('Create volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get volunteer by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    let query = `
      SELECT 
        v.id, v.username, v.full_name, v.phone, v.email, 
        v.employee_id, v.assigned_villages, v.is_active,
        v.created_at, v.updated_at,
        u.full_name as employee_name
      FROM volunteers v
      LEFT JOIN users u ON u.id = v.employee_id
      WHERE v.id = $1
    `;
    const params: any[] = [id];

    if (user.role === 'employee') {
      query += ' AND v.employee_id = $2';
      params.push(user.userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update volunteer (Employee or Officer)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { full_name, phone, email, is_active, village_ids } = req.body;

    // Check if volunteer exists and user has permission
    let checkQuery = 'SELECT employee_id FROM volunteers WHERE id = $1';
    const checkParams: any[] = [id];

    if (user.role === 'employee') {
      checkQuery += ' AND employee_id = $2';
      checkParams.push(user.userId);
    }

    const checkResult = await pool.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      params.push(full_name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      params.push(phone);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      params.push(email);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      params.push(is_active);
    }
    if (village_ids !== undefined && Array.isArray(village_ids)) {
      updates.push(`assigned_villages = $${paramCount++}`);
      params.push(village_ids);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await pool.query(
      `UPDATE volunteers 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, username, full_name, phone, email, employee_id, assigned_villages, is_active, updated_at`,
      params
    );

    res.json({ 
      message: 'Volunteer updated successfully', 
      volunteer: result.rows[0] 
    });
  } catch (error: any) {
    console.error('Update volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update volunteer password
router.put('/:id/password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Check if volunteer exists and user has permission
    let checkQuery = 'SELECT employee_id FROM volunteers WHERE id = $1';
    const checkParams: any[] = [id];

    if (user.role === 'employee') {
      checkQuery += ' AND employee_id = $2';
      checkParams.push(user.userId);
    }

    const checkResult = await pool.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    const passwordHash = await hashPassword(password);

    await pool.query(
      'UPDATE volunteers SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Update volunteer password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete volunteer (soft delete by setting is_active = false)
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Check if volunteer exists and user has permission
    let checkQuery = 'SELECT employee_id FROM volunteers WHERE id = $1';
    const checkParams: any[] = [id];

    if (user.role === 'employee') {
      checkQuery += ' AND employee_id = $2';
      checkParams.push(user.userId);
    }

    const checkResult = await pool.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    // Soft delete
    await pool.query(
      'UPDATE volunteers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ message: 'Volunteer deactivated successfully' });
  } catch (error: any) {
    console.error('Delete volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get volunteer's assigned villages
router.get('/:id/villages', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Check if volunteer exists and user has permission
    let checkQuery = 'SELECT assigned_villages, employee_id FROM volunteers WHERE id = $1';
    const checkParams: any[] = [id];

    if (user.role === 'employee') {
      checkQuery += ' AND employee_id = $2';
      checkParams.push(user.userId);
    }

    const checkResult = await pool.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    const assignedVillages = checkResult.rows[0].assigned_villages || [];

    if (assignedVillages.length === 0) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT id, name, state, district, block, population
       FROM villages
       WHERE id = ANY($1::int[])
       ORDER BY name`,
      [assignedVillages]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get volunteer villages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;






