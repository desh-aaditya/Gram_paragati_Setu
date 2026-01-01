import express from 'express';
import pool from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|m4a/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Invalid file type'));
    },
});

// 1. Submit Issue / Add Vote (Villager)
router.post('/:villageId/submit', upload.array('attachments', 5), async (req, res) => {
    try {
        const { villageId } = req.params;
        const {
            client_id,
            issue_type,
            description,
            device_id,
            category,
            is_volunteer = false
        } = req.body;

        if (!villageId || !issue_type || !description || !device_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if similar issue exists (same type in same village)
        const existingIssue = await pool.query(
            `SELECT id, vote_count FROM village_issues 
       WHERE village_id = $1 AND issue_type = $2 AND status != 'rejected'`,
            [villageId, issue_type]
        );

        let issueId;
        let isNew = false;
        let voteAdded = false;

        if (existingIssue.rows.length > 0) {
            issueId = existingIssue.rows[0].id;

            // Check if this device already voted for this issue
            const existingVote = await pool.query(
                'SELECT id FROM issue_votes WHERE issue_id = $1 AND device_id = $2',
                [issueId, device_id]
            );

            if (existingVote.rows.length === 0) {
                // Add vote
                await pool.query(
                    'INSERT INTO issue_votes (issue_id, device_id) VALUES ($1, $2)',
                    [issueId, device_id]
                );

                // Increment count
                await pool.query(
                    'UPDATE village_issues SET vote_count = vote_count + 1 WHERE id = $1',
                    [issueId]
                );
                voteAdded = true;
            }
        } else {
            // Create new issue
            const attachments = req.files ? (req.files as Express.Multer.File[]).map(f => `/uploads/${f.filename}`) : [];

            const newIssue = await pool.query(
                `INSERT INTO village_issues 
         (village_id, client_id, issue_type, description, category, attachments, is_volunteer, vote_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
         RETURNING id`,
                [villageId, client_id, issue_type, description, category, JSON.stringify(attachments), is_volunteer]
            );

            issueId = newIssue.rows[0].id;
            isNew = true;
            voteAdded = true;

            // Add initial vote
            await pool.query(
                'INSERT INTO issue_votes (issue_id, device_id) VALUES ($1, $2)',
                [issueId, device_id]
            );
        }

        res.json({
            message: isNew ? 'Issue reported successfully' : (voteAdded ? 'Vote added to existing issue' : 'You have already voted for this issue'),
            issue_id: issueId,
            vote_added: voteAdded,
            is_new: isNew
        });

    } catch (error: any) {
        console.error('Submit issue error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. List pending issues (Volunteer)
router.get('/:villageId/pending', async (req, res) => {
    try {
        const { villageId } = req.params;
        const result = await pool.query(
            `SELECT * FROM village_issues 
       WHERE village_id = $1 AND status = 'pending_validation'
       ORDER BY vote_count DESC, created_at DESC`,
            [villageId]
        );
        res.json(result.rows);
    } catch (error: any) {
        console.error('List pending issues error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Validate Issue (Volunteer)
router.post('/:issueId/validate', upload.array('media', 5), async (req, res) => {
    try {
        const { issueId } = req.params;
        const { volunteer_id, notes, location_lat, location_lng } = req.body;

        if (!volunteer_id) {
            return res.status(400).json({ error: 'Volunteer ID required' });
        }

        const media = req.files ? (req.files as Express.Multer.File[]).map(f => `/uploads/${f.filename}`) : [];

        // Create validation record
        await pool.query(
            `INSERT INTO issue_validations 
       (issue_id, volunteer_id, notes, media, location_lat, location_lng)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [issueId, volunteer_id, notes, JSON.stringify(media), location_lat, location_lng]
        );

        // Update issue status
        await pool.query(
            `UPDATE village_issues SET status = 'validated' WHERE id = $1`,
            [issueId]
        );

        res.json({ message: 'Issue validated successfully' });
    } catch (error: any) {
        console.error('Validate issue error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Approve/Reject/Convert (Officer)
// Get all issues for a village (Officer view)
router.get('/:villageId/all', async (req, res) => {
    try {
        const { villageId } = req.params;

        // Get issues with validation details
        const result = await pool.query(
            `SELECT i.*, 
              v.notes as validation_notes, 
              v.media as validation_media,
              vol.full_name as validator_name
       FROM village_issues i
       LEFT JOIN issue_validations v ON v.issue_id = i.id
       LEFT JOIN volunteers vol ON vol.id = v.volunteer_id
       WHERE i.village_id = $1
       ORDER BY 
        ((i.vote_count * 2) + (CASE WHEN i.status = 'validated' THEN 5 ELSE 0 END)) DESC,
        i.created_at DESC`,
            [villageId]
        );

        res.json(result.rows);
    } catch (error: any) {
        console.error('List all issues error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:issueId/status', async (req, res) => {
    try {
        const { issueId } = req.params;
        const { status } = req.body; // approved, rejected

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await pool.query(
            'UPDATE village_issues SET status = $1 WHERE id = $2',
            [status, issueId]
        );

        res.json({ message: 'Issue ' + status });
    } catch (error: any) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:issueId/convert', async (req, res) => {
    try {
        const { issueId } = req.params;
        const { project_data } = req.body; // Additional project fields if needed

        // Get issue details
        const issueResult = await pool.query('SELECT * FROM village_issues WHERE id = $1', [issueId]);
        if (issueResult.rows.length === 0) return res.status(404).json({ error: 'Issue not found' });

        const issue = issueResult.rows[0];

        // Create Project
        const projectResult = await pool.query(
            `INSERT INTO projects(village_id, title, description, project_type, status, created_at)
       VALUES($1, $2, $3, $4, 'planned', NOW())
       RETURNING * `,
            [issue.village_id, issue.issue_type, issue.description, issue.category || 'Infrastructure']
        );

        // Update issue status
        await pool.query(
            "UPDATE village_issues SET status = 'converted' WHERE id = $1",
            [issueId]
        );

        res.json({
            message: 'Issue converted to project',
            project: projectResult.rows[0]
        });

    } catch (error: any) {
        console.error('Convert issue error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
