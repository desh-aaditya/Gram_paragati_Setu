
import express from 'express';
import pool from '../config/database';

const router = express.Router();

// Get public project details by token
router.get('/projects/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Get project basic details
        const projectQuery = `
      SELECT 
        p.id, p.title, p.description, p.project_type, 
        p.status, p.allocated_amount, p.utilized_amount, p.start_date, p.end_date,
        v.name as village_name, p.updated_at
      FROM projects p
      JOIN villages v ON v.id = p.village_id
      WHERE p.public_token = $1 AND v.is_active = true
    `;
        const projectResult = await pool.query(projectQuery, [token]);

        if (projectResult.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = projectResult.rows[0];

        // Get checkpoints with submission status
        // We only want approved submissions to show progress securely
        const checkpointsResult = await pool.query(
            `SELECT 
        c.id, c.name, c.description, c.sequence_order, c.estimated_date,
        COALESCE(bool_or(cs.status = 'approved'), false) as is_completed,
        MAX(cs.submitted_at) as completed_at
      FROM checkpoints c
      LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = c.id
      WHERE c.project_id = $1
      GROUP BY c.id
      ORDER BY c.sequence_order`,
            [project.id]
        );

        project.checkpoints = checkpointsResult.rows;

        // Calculate completion percentage
        const totalCheckpoints = checkpointsResult.rows.length;
        const completedCheckpoints = checkpointsResult.rows.filter((c: any) => c.is_completed).length;
        project.completion_percentage = totalCheckpoints > 0
            ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
            : 0;

        // Get recent approved images (limit 5) for gallery
        // Get recent approved images (limit 5) for gallery
        const imagesResult = await pool.query(
            `SELECT 
        m.url as image_url, cs.submitted_at as created_at
      FROM checkpoint_submissions cs
      JOIN media m ON m.submission_id = cs.id
      JOIN checkpoints c ON c.id = cs.checkpoint_id
      WHERE c.project_id = $1 AND cs.status = 'approved'
      AND m.type LIKE 'image/%'
      ORDER BY cs.submitted_at DESC
      LIMIT 5`,
            [project.id]
        );

        project.recent_images = imagesResult.rows;

        res.json(project);
    } catch (error: any) {
        console.error('Get public project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
