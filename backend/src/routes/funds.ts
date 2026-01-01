import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// --- Helper: build common transaction list query with filters ---
const buildTransactionsQuery = ({
  state,
  district,
  villageId,
  projectId,
  startDate,
  endDate,
}: {
  state?: string;
  district?: string;
  villageId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  let query = `
    SELECT 
      ft.*,
      p.title as project_title,
      v.name as village_name,
      v.state,
      v.district,
      u.full_name as approved_by_name
    FROM fund_transactions ft
    JOIN projects p ON p.id = ft.project_id
    JOIN villages v ON v.id = p.village_id
    JOIN users u ON u.id = ft.approved_by
    WHERE v.is_active = true
  `;

  const params: any[] = [];
  let paramCount = 1;

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

  if (villageId) {
    query += ` AND v.id = $${paramCount}`;
    params.push(villageId);
    paramCount++;
  }

  if (projectId) {
    query += ` AND p.id = $${paramCount}`;
    params.push(projectId);
    paramCount++;
  }

  if (startDate) {
    query += ` AND ft.created_at >= $${paramCount}`;
    params.push(startDate);
    paramCount++;
  }

  if (endDate) {
    query += ` AND ft.created_at <= $${paramCount}`;
    params.push(endDate);
    paramCount++;
  }

  query += ' ORDER BY ft.created_at DESC, ft.id DESC';

  return { query, params };
};

// --- Summary: overall fund allocation/utilization ---
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const { state, district, village_id, project_id } = req.query;

    // Base query from projects, since allocated/utilized are denormalized there
    let query = `
      SELECT 
        COALESCE(SUM(p.allocated_amount), 0) as total_allocated,
        COALESCE(SUM(p.utilized_amount), 0) as total_utilized,
        COUNT(*) as total_projects
      FROM projects p
      JOIN villages v ON v.id = p.village_id
      WHERE v.is_active = true
    `;

    const params: any[] = [];
    let paramCount = 1;

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

    if (village_id) {
      query += ` AND v.id = $${paramCount}`;
      params.push(village_id);
      paramCount++;
    }

    if (project_id) {
      query += ` AND p.id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }

    const result = await pool.query(query, params);
    const row = result.rows[0] || {
      total_allocated: 0,
      total_utilized: 0,
      total_projects: 0,
    };

    const totalAllocated = parseFloat(row.total_allocated || 0);
    const totalUtilized = parseFloat(row.total_utilized || 0);

    res.json({
      total_allocated: totalAllocated,
      total_utilized: totalUtilized,
      total_projects: Number(row.total_projects || 0),
      remaining: totalAllocated - totalUtilized,
    });
  } catch (error: any) {
    console.error('Get funds summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Transactions list with filters (state/district/village/project/date) ---
router.get('/transactions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { state, district, village_id, project_id, start_date, end_date } = req.query;

    const { query, params } = buildTransactionsQuery({
      state: state as string | undefined,
      district: district as string | undefined,
      villageId: village_id as string | undefined,
      projectId: project_id as string | undefined,
      startDate: start_date as string | undefined,
      endDate: end_date as string | undefined,
    });

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get fund transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Allocate funds (Officer only)
router.post('/allocate', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    const { project_id, amount, tranche, note, effective_date } = req.body;

    if (!project_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Project ID and valid amount are required' });
    }

    await client.query('BEGIN');

    // Get current project allocation
    const projectResult = await client.query(
      'SELECT allocated_amount FROM projects WHERE id = $1 FOR UPDATE',
      [project_id]
    );

    if (projectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];
    const newAllocatedAmount =
      parseFloat(project.allocated_amount) + parseFloat(amount.toString());

    // Update project allocation
    await client.query(
      'UPDATE projects SET allocated_amount = $1 WHERE id = $2',
      [newAllocatedAmount, project_id]
    );

    const descriptionParts: string[] = [];
    if (tranche) descriptionParts.push(`Tranche: ${tranche}`);
    if (note) descriptionParts.push(note);

    // Record transaction
    await client.query(
      `INSERT INTO fund_transactions (project_id, transaction_type, amount, description, approved_by, approved_at, created_by)
       VALUES ($1, 'allocation', $2, $3, $4, COALESCE($5, CURRENT_TIMESTAMP), $4)`,
      [
        project_id,
        amount,
        descriptionParts.join(' — ') || 'Additional fund allocation',
        req.user!.userId,
        effective_date || null,
      ]
    );

    await client.query('COMMIT');
    res.json({ message: 'Funds allocated successfully' });
  } catch (error: any) {
    await pool.query('ROLLBACK');
    console.error('Allocate funds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Release/utilize funds (Officer only)
router.post('/release', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    const { project_id, amount, note, effective_date } = req.body;

    if (!project_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Project ID and valid amount are required' });
    }

    await client.query('BEGIN');

    // Get current project status
    const projectResult = await client.query(
      'SELECT allocated_amount, utilized_amount FROM projects WHERE id = $1 FOR UPDATE',
      [project_id]
    );

    if (projectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];
    const newUtilizedAmount =
      parseFloat(project.utilized_amount) + parseFloat(amount.toString());

    if (newUtilizedAmount > parseFloat(project.allocated_amount)) {
      await client.query('ROLLBACK');
      return res
        .status(400)
        .json({ error: 'Utilized amount cannot exceed allocated amount' });
    }

    // Update project utilization
    await client.query(
      'UPDATE projects SET utilized_amount = $1 WHERE id = $2',
      [newUtilizedAmount, project_id]
    );

    // Record transaction
    await client.query(
      `INSERT INTO fund_transactions (project_id, transaction_type, amount, description, approved_by, approved_at, created_by)
       VALUES ($1, 'release', $2, $3, $4, COALESCE($5, CURRENT_TIMESTAMP), $4)`,
      [
        project_id,
        amount,
        note || 'Fund release',
        req.user!.userId,
        effective_date || null,
      ]
    );

    await client.query('COMMIT');
    res.json({ message: 'Funds released successfully' });
  } catch (error: any) {
    await pool.query('ROLLBACK');
    console.error('Release funds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Optional: edit a fund transaction (Officer only)
// This keeps project totals consistent by applying the delta to allocated/utilized.
router.patch('/:id', authenticate, authorize('officer'), async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { amount, note } = req.body;

    if (amount !== undefined && Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    await client.query('BEGIN');

    const txResult = await client.query(
      'SELECT * FROM fund_transactions WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (txResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Fund transaction not found' });
    }

    const tx = txResult.rows[0];
    const projectId = tx.project_id;

    let newAmount = tx.amount;
    if (amount !== undefined) {
      const delta = parseFloat(amount.toString()) - parseFloat(tx.amount.toString());

      if (tx.transaction_type === 'allocation') {
        // Adjust allocated_amount by delta
        await client.query(
          'UPDATE projects SET allocated_amount = allocated_amount + $1 WHERE id = $2',
          [delta, projectId]
        );
      } else if (tx.transaction_type === 'release') {
        // Adjust utilized_amount by delta, guard against over-utilization
        const projectResult = await client.query(
          'SELECT allocated_amount, utilized_amount FROM projects WHERE id = $1 FOR UPDATE',
          [projectId]
        );

        if (projectResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Project not found' });
        }

        const project = projectResult.rows[0];
        const newUtilized =
          parseFloat(project.utilized_amount) + delta;

        if (newUtilized > parseFloat(project.allocated_amount)) {
          await client.query('ROLLBACK');
          return res
            .status(400)
            .json({ error: 'Utilized amount cannot exceed allocated amount' });
        }

        await client.query(
          'UPDATE projects SET utilized_amount = $1 WHERE id = $2',
          [newUtilized, projectId]
        );
      }

      newAmount = amount;
    }

    const newDescription =
      note !== undefined
        ? note
        : tx.description;

    const updated = await client.query(
      `UPDATE fund_transactions
       SET amount = $1, description = $2
       WHERE id = $3
       RETURNING *`,
      [newAmount, newDescription, id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Fund transaction updated successfully', transaction: updated.rows[0] });
  } catch (error: any) {
    await pool.query('ROLLBACK');
    console.error('Update fund transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
