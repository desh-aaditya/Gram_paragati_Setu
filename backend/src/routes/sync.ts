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

// Sync priority votes
router.post('/priority-votes', async (req, res) => {
  try {
    const { votes } = req.body;

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return res.status(400).json({ error: 'Votes array is required' });
    }

    const syncedMap: Record<string, number> = {};

    for (const vote of votes) {
      const {
        client_id,
        village_id,
        required_infrastructure,
        description,
        category,
        is_volunteer,
        volunteer_id,
        employee_id,
        created_at,
      } = vote;

      if (!client_id || !village_id || !required_infrastructure) {
        continue;
      }

      try {
        // Check if already synced
        const existingResult = await pool.query(
          'SELECT id FROM village_priority_votes WHERE client_id = $1',
          [client_id]
        );

        let voteId: number;

        if (existingResult.rows.length > 0) {
          voteId = existingResult.rows[0].id;
        } else {
          // Check for duplicate content (same village, infra, description) to avoid spam, 
          // but if client_id is different, we might treat it as a new vote or increment count.
          // For offline sync, we trust client_id as the unique identifier for a specific user action.

          // However, we also want to aggregate votes.
          // If a vote with same content exists (but different client_id), we usually increment count.
          // But here we are syncing a specific user's submission.
          // Let's insert it as a new row if client_id doesn't exist.
          // The aggregation logic (counting votes) should happen when querying or via a separate aggregation table/view.
          // BUT, the existing /priority-vote endpoint increments `total_votes` if content matches.
          // We should probably follow that logic BUT keep track of this specific submission's client_id to avoid re-syncing it.

          // Wait, if we just increment count, we lose the record that THIS client_id was synced.
          // We need to store the client_id.
          // If the schema supports one row per vote, we insert.
          // If the schema aggregates (total_votes), we can't easily store multiple client_ids in one row without an array.

          // Let's check the schema in mobile.ts:
          // It checks for existing vote with same content AND (client_id IS NULL OR client_id != $3).
          // If found, it updates total_votes.
          // This implies multiple people voting for same thing = 1 row with high count.
          // But then we can't store ALL client_ids to prevent re-syncs from different devices if we only store one client_id.
          // Actually, the current schema seems to store `client_id` on the vote row.
          // This suggests 1 row = 1 unique vote definition, and `total_votes` tracks how many times it was voted.
          // But if we want to prevent THIS user from re-syncing the SAME vote, we need to know if THIS client_id was processed.

          // If we update an existing row, we don't change its client_id (it belongs to the first voter).
          // So we can't use client_id on the main table for idempotency of SUBSEQUENT votes.

          // ideally we should have a `vote_submissions` table.
          // Given the constraints and existing code in mobile.ts:
          // It returns `priority` object.

          // For this sync implementation, to be safe and simple:
          // We will try to find a vote with this client_id.
          // If found -> already synced.
          // If not found -> 
          //    Check if similar vote exists (same village, infra).
          //    If yes -> Increment total_votes. BUT we still need to record that THIS client_id is done.
          //    If we don't record it, the mobile app will keep sending it.

          // SOLUTION: We should probably just insert a new row for every offline vote if we want strict idempotency tracking via client_id,
          // OR we accept that "incrementing count" is the action, but we need a way to say "yes, we counted this client_id".
          // Since we can't change the schema easily right now without migrations (which I can do, but trying to be minimal),
          // I will assume for now that we want to INSERT if client_id is new.
          // Wait, `mobile.ts` logic:
          // If existing found (different client_id) -> Update total_votes.
          // If NOT found -> Insert new row with client_id.

          // If we update total_votes, we DO NOT store the new client_id.
          // This means we cannot detect if we already processed this specific client_id later.
          // This is a flaw in the current `mobile.ts` logic for offline sync of *subsequent* votes.

          // However, for the purpose of this task, I will implement it such that:
          // We ALWAYS insert a new row for a new client_id, even if it duplicates content, 
          // OR we create a separate table for tracking synced_ids.

          // Let's look at `village_priority_votes` schema again.
          // id, client_id, village_id, infrastructure_type, description, category, is_volunteer, votes, created_at

          // If I change the logic to ALWAYS insert for unique client_id, then `total_votes` will always be 1 for these rows.
          // And aggregation would be sum(total_votes) group by village, infra.
          // This seems safer for data integrity.

          const insertResult = await pool.query(
            `INSERT INTO village_priority_votes 
             (village_id, required_infrastructure, description, category, is_volunteer, volunteer_id, employee_id, client_id, total_votes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9)
             RETURNING id`,
            [
              village_id,
              required_infrastructure,
              description,
              category || null,
              is_volunteer || false,
              volunteer_id || null,
              employee_id || null,
              client_id,
              created_at || new Date()
            ]
          );
          voteId = insertResult.rows[0].id;
        }

        syncedMap[client_id] = voteId;
      } catch (error) {
        console.error(`Error syncing vote ${client_id}:`, error);
      }
    }

    res.json({
      message: 'Votes synced successfully',
      synced_map: syncedMap,
      synced_count: Object.keys(syncedMap).length,
    });
  } catch (error: any) {
    console.error('Sync votes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
