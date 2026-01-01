import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { updateAdarshScore } from '../services/adarshScoreService';

const router = express.Router();

// Get submissions for a checkpoint
router.get('/:id/submissions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        cs.*,
        c.project_id,
        p.village_id,
        v.name as village_name,
        p.title as project_title
      FROM checkpoint_submissions cs
      JOIN checkpoints c ON c.id = cs.checkpoint_id
      JOIN projects p ON p.id = c.project_id
      JOIN villages v ON v.id = p.village_id
      WHERE cs.checkpoint_id = $1
      ORDER BY cs.submitted_at DESC`,
      [id]
    );

    // Get media for each submission
    for (const submission of result.rows) {
      const mediaResult = await pool.query(
        'SELECT * FROM media WHERE submission_id = $1 ORDER BY created_at',
        [submission.id]
      );
      // Map database column names to frontend expected names
      submission.media = mediaResult.rows.map(m => ({
        id: m.id,
        url: m.file_url || m.url, // Handle both column names
        type: m.media_type || m.type, // Handle both column names  
        file_name: m.file_name,
        file_size: m.file_size,
        created_at: m.created_at
      }));
    }

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Review submission (approve/reject)
router.post('/:id/submissions/:submissionId/review', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id, submissionId } = req.params;
    const { status, review_notes } = req.body;

    if (!status || !['approved', 'rejected', 'requires_revision'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (approved/rejected/requires_revision)' });
    }

    // Get submission to verify it belongs to the checkpoint
    const submissionResult = await pool.query(
      `SELECT cs.*, c.project_id, p.village_id
       FROM checkpoint_submissions cs
       JOIN checkpoints c ON c.id = cs.checkpoint_id
       JOIN projects p ON p.id = c.project_id
       WHERE cs.id = $1 AND cs.checkpoint_id = $2`,
      [submissionId, id]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = submissionResult.rows[0];
    const villageId = submission.village_id;
    const projectId = submission.project_id;

    // Update submission
    await pool.query(
      `UPDATE checkpoint_submissions 
       SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, review_notes || null, req.user!.userId, submissionId]
    );

    // If approved, recalculate Adarsh score for the village
    let adarsh: any = null;
    if (status === 'approved') {
      // AUTOMATIC FUND UTILIZATION LOGIC
      // 1. Get project details and total checkpoints count
      const projectDetails = await pool.query(
        'SELECT allocated_amount, title FROM projects WHERE id = $1',
        [projectId]
      );
      const checkpointCount = await pool.query(
        'SELECT COUNT(*) as count FROM checkpoints WHERE project_id = $1',
        [projectId]
      );

      const allocatedAmount = parseFloat(projectDetails.rows[0].allocated_amount);
      const totalCheckpoints = parseInt(checkpointCount.rows[0].count) || 1; // Avoid div by zero

      // 2. Calculate amount per checkpoint (Simple pro-rata for now)
      const amountToUtilize = allocatedAmount / totalCheckpoints;

      // 3. Update Project Utilized Amount
      await pool.query(
        'UPDATE projects SET utilized_amount = COALESCE(utilized_amount, 0) + $1 WHERE id = $2',
        [amountToUtilize, projectId]
      );

      // 4. Record Fund Transaction
      await pool.query(
        `INSERT INTO fund_transactions (project_id, transaction_type, amount, description)
         VALUES ($1, 'release', $2, $3)`,
        [projectId, amountToUtilize, `Auto-release for completing checkpoint in: ${projectDetails.rows[0].title}`]
      );

      // Recalculate Adarsh score
      await updateAdarshScore(villageId).catch(console.error);

      const adarshResult = await pool.query(
        'SELECT overall_score, score_breakdown FROM adarsh_scores WHERE village_id = $1',
        [villageId]
      );
      if (adarshResult.rows.length > 0) {
        adarsh = {
          score: adarshResult.rows[0].overall_score,
          components: adarshResult.rows[0].score_breakdown,
        };
      }
    }

    res.json({
      message: 'Submission reviewed successfully',
      submissionId,
      checkpointId: id,
      projectId,
      villageId,
      status,
      adarsh,
    });
  } catch (error: any) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
