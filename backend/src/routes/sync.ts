import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { updateAdarshScore } from '../services/adarshScoreService';

const router = express.Router();

// Mobile sync endpoint - batch sync reports/submissions
router.post('/reports', async (req, res) => {
  try {
    const { reports, volunteer_id } = req.body;

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({ error: 'Reports array is required' });
    }

    if (!volunteer_id) {
      return res.status(400).json({ error: 'Volunteer ID is required' });
    }

    const syncedMap: Record<string, number> = {};
    const villageIds = new Set<number>();

    // Process each report
    for (const report of reports) {
      const {
        client_id,
        checkpoint_id,
        submitted_at,
        media_items = [],
      } = report;

      if (!client_id || !checkpoint_id) {
        continue; // Skip invalid reports
      }

      try {
        // Check if already synced
        const existingResult = await pool.query(
          'SELECT id FROM checkpoint_submissions WHERE client_id = $1',
          [client_id]
        );

        let submissionId: number;

        if (existingResult.rows.length > 0) {
          submissionId = existingResult.rows[0].id;
        } else {
          // Insert new submission
          const insertResult = await pool.query(
            `INSERT INTO checkpoint_submissions 
              (checkpoint_id, volunteer_id, submitted_at, client_id, status)
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING id`,
            [checkpoint_id, volunteer_id, submitted_at || new Date(), client_id]
          );

          submissionId = insertResult.rows[0].id;

          // Insert media items
          for (const mediaItem of media_items) {
            await pool.query(
              `INSERT INTO media 
                (submission_id, media_type, file_url, file_name, file_size, mime_type, metadata)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                submissionId,
                mediaItem.media_type || 'photo',
                mediaItem.file_url || '',
                mediaItem.file_name || null,
                mediaItem.file_size || null,
                mediaItem.mime_type || null,
                JSON.stringify(mediaItem.metadata || {}),
              ]
            );
          }

          // Get village ID for score recalculation
          const checkpointResult = await pool.query(
            `SELECT p.village_id FROM checkpoints c
             JOIN projects p ON p.id = c.project_id
             WHERE c.id = $1`,
            [checkpoint_id]
          );

          if (checkpointResult.rows.length > 0) {
            villageIds.add(checkpointResult.rows[0].village_id);
          }
        }

        syncedMap[client_id] = submissionId;
      } catch (error: any) {
        console.error(`Error syncing report ${client_id}:`, error);
        // Continue with other reports
      }
    }

    // Recalculate Adarsh scores for affected villages
    for (const villageId of villageIds) {
      await updateAdarshScore(villageId).catch(console.error);
    }

    // Log sync
    await pool.query(
      `INSERT INTO sync_logs (volunteer_id, sync_type, client_ids, synced_count, sync_status)
       VALUES ($1, 'reports', $2, $3, 'success')`,
      [volunteer_id, Object.keys(syncedMap), Object.keys(syncedMap).length]
    );

    res.json({
      message: 'Reports synced successfully',
      synced_map: syncedMap,
      synced_count: Object.keys(syncedMap).length,
    });
  } catch (error: any) {
    console.error('Sync reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Media presign endpoint (for mobile uploads)
router.post('/media/presign', async (req, res) => {
  try {
    const { file_name, file_type, file_size } = req.body;

    if (!file_name || !file_type) {
      return res.status(400).json({ error: 'File name and type are required' });
    }

    // For local development, return a simple upload URL
    // In production, this would generate a presigned S3/MinIO URL
    const fileId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const fileExtension = file_name.split('.').pop();
    const uploadFileName = `${fileId}.${fileExtension}`;

    // Return upload URL and metadata
    res.json({
      upload_url: `/api/uploads/${uploadFileName}`,
      file_id: fileId,
      file_name: uploadFileName,
      expires_in: 3600, // 1 hour
    });
  } catch (error: any) {
    console.error('Presign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
