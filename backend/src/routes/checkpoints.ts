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
      submission.media = mediaResult.rows;
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

    // Update submission
    await pool.query(
      `UPDATE checkpoint_submissions 
       SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, review_notes || null, req.user!.userId, submissionId]
    );

    // If approved, update project utilization and recalculate Adarsh score
    if (status === 'approved') {
      // Recalculate Adarsh score for the village
      await updateAdarshScore(villageId).catch(console.error);
    }

    res.json({ message: 'Submission reviewed successfully' });
  } catch (error: any) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
