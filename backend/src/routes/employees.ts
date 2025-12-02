import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { hashPassword } from '../config/auth';

const router = express.Router();

// Get all employees (Officer only)
router.get('/', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id, u.username, u.email, u.role, u.full_name, u.phone, u.department, u.is_active,
        COUNT(ev.village_id) as assigned_villages_count
      FROM users u
      LEFT JOIN employee_villages ev ON ev.employee_id = u.id
      WHERE u.role = 'employee'
      GROUP BY u.id
      ORDER BY u.full_name`
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create employee (Officer only)
router.post('/', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const { username, email, password, full_name, phone, department, village_ids } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'Username, email, password, and full name are required' });
    }

    // Check if username/email already exists
    const existingResult = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, full_name, phone, department)
       VALUES ($1, $2, $3, 'employee', $4, $5, $6)
       RETURNING id, username, email, full_name, phone, department`,
      [username, email, passwordHash, full_name, phone || null, department || null]
    );

    const employeeId = result.rows[0].id;

    // Assign villages if provided
    if (village_ids && Array.isArray(village_ids) && village_ids.length > 0) {
      for (const villageId of village_ids) {
        await pool.query(
          'INSERT INTO employee_villages (employee_id, village_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [employeeId, villageId]
        );
      }
    }

    res.status(201).json({ message: 'Employee created successfully', employee: result.rows[0] });
  } catch (error: any) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee village assignments
router.get('/:id/villages', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT ev.village_id, v.name, v.state, v.district
       FROM employee_villages ev
       JOIN villages v ON v.id = ev.village_id
       WHERE ev.employee_id = $1
       ORDER BY v.name`,
      [id]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get employee villages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update employee village assignments (Officer only)
router.put('/:id/villages', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { village_ids } = req.body;

    if (!Array.isArray(village_ids)) {
      return res.status(400).json({ error: 'Village IDs must be an array' });
    }

    // Verify employee exists
    const employeeResult = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [id, 'employee']
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Remove existing assignments
    await pool.query('DELETE FROM employee_villages WHERE employee_id = $1', [id]);

    // Add new assignments
    for (const villageId of village_ids) {
      await pool.query(
        'INSERT INTO employee_villages (employee_id, village_id) VALUES ($1, $2)',
        [id, villageId]
      );
    }

    res.json({ message: 'Village assignments updated successfully' });
  } catch (error: any) {
    console.error('Update employee villages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
