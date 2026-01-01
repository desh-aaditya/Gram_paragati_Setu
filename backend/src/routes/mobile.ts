import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { comparePassword } from '../config/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure uploads directory exists
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads', { recursive: true });
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and audio files are allowed.'));
    }
  },
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// Get all states (distinct from villages)
router.get('/states', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT state FROM villages WHERE is_active = true ORDER BY state'
    );
    res.json(result.rows.map((r: any) => r.state));
  } catch (error: any) {
    console.error('Get states error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get districts for a state
router.get('/districts', async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) {
      return res.status(400).json({ error: 'State parameter is required' });
    }

    const result = await pool.query(
      'SELECT DISTINCT district FROM villages WHERE state = $1 AND is_active = true ORDER BY district',
      [state]
    );
    res.json(result.rows.map((r: any) => r.district));
  } catch (error: any) {
    console.error('Get districts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get villages for a district
router.get('/villages', async (req, res) => {
  try {
    const { state, district } = req.query;
    if (!state || !district) {
      return res.status(400).json({ error: 'State and district parameters are required' });
    }

    const result = await pool.query(
      `SELECT 
        v.id, 
        name, 
        state, 
        district, 
        block, 
        population,
        COALESCE(a.overall_score, 0) as adarsh_score
      FROM villages v
      LEFT JOIN adarsh_scores a ON a.village_id = v.id
      WHERE v.state = $1 AND v.district = $2 AND v.is_active = true 
      ORDER BY v.name`,
      [state, district]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get villages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit village priority vote (villager or volunteer)
router.post('/priority-vote', upload.single('audio_file'), async (req: any, res) => {
  try {
    const {
      village_id,
      required_infrastructure,
      description,
      category,
      is_volunteer = false,
      volunteer_id,
      employee_id,
      client_id, // For offline sync idempotency
    } = req.body;

    // Handle audio file
    let audio_url = null;
    if (req.file) {
      audio_url = `/uploads/${req.file.filename}`;
    }

    if (!village_id || !required_infrastructure || !description) {
      return res.status(400).json({ error: 'Village ID, infrastructure, and description are required' });
    }

    // 1. Idempotency check: If client_id is provided, check if we already processed this specific vote
    if (client_id) {
      const idempotentResult = await pool.query(
        'SELECT * FROM village_priority_votes WHERE client_id = $1',
        [client_id]
      );

      if (idempotentResult.rows.length > 0) {
        return res.json({
          message: 'Priority vote already submitted',
          priority: idempotentResult.rows[0],
          is_new: false
        });
      }
    }

    // 2. Check if same infrastructure request already exists for this village (merge logic)
    // We explicitly exclude the current client_id (though we just checked it doesn't exist)
    // to be safe and consistent with the logic.
    const existingResult = await pool.query(
      `SELECT id, total_votes FROM village_priority_votes 
       WHERE village_id = $1 AND required_infrastructure = $2 
       AND (client_id IS NULL OR client_id != $3)`,
      [village_id, required_infrastructure, client_id || '']
    );

    if (existingResult.rows.length > 0) {
      // Increment vote count
      const updated = await pool.query(
        `UPDATE village_priority_votes 
         SET total_votes = total_votes + 1
         WHERE id = $1
         RETURNING *`,
        [existingResult.rows[0].id]
      );
      return res.json({
        message: 'Vote added successfully',
        priority: updated.rows[0],
        is_new: false
      });
    } else {
      // Create new priority vote
      const result = await pool.query(
        `INSERT INTO village_priority_votes 
         (village_id, required_infrastructure, description, category, is_volunteer, volunteer_id, employee_id, client_id, audio_url, total_votes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
         RETURNING *`,
        [village_id, required_infrastructure, description, category || null, is_volunteer, volunteer_id || null, employee_id || null, client_id || null, audio_url]
      );
      return res.json({
        message: 'Priority vote submitted successfully',
        priority: result.rows[0],
        is_new: true
      });
    }
  } catch (error: any) {
    console.error('Submit priority vote error:', error);
    fs.appendFileSync('backend_error.log', `${new Date().toISOString()} - Submit priority vote error: ${error.message}\n${JSON.stringify(error)}\n`);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get village analytics (non-login)
router.get('/village/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;

    // Get village details
    const villageResult = await pool.query(
      `SELECT 
        v.*,
        COALESCE(a.overall_score, 0) as adarsh_score,
        COALESCE(a.is_adarsh_candidate, false) as is_adarsh_candidate,
        a.score_breakdown
      FROM villages v
      LEFT JOIN adarsh_scores a ON a.village_id = v.id
      WHERE v.id = $1 AND v.is_active = true`,
      [id]
    );

    if (villageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Village not found' });
    }

    const village = villageResult.rows[0];
    village.score_breakdown = village.score_breakdown ? JSON.parse(village.score_breakdown) : null;

    // Get projects with completion
    const projectsResult = await pool.query(
      `SELECT 
        p.id, p.title, p.project_type, p.status,
        p.allocated_amount, p.utilized_amount,
        COUNT(DISTINCT c.id) as total_checkpoints,
        COUNT(DISTINCT CASE WHEN cs.status = 'approved' THEN c.id END) as completed_checkpoints
      FROM projects p
      LEFT JOIN checkpoints c ON c.project_id = p.id
      LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = c.id AND cs.status = 'approved'
      WHERE p.village_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC`,
      [id]
    );

    const projects = projectsResult.rows.map((p: any) => {
      const total = Number(p.total_checkpoints || 0);
      const completed = Number(p.completed_checkpoints || 0);
      return {
        ...p,
        completion_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    // Get checkpoint images
    const imagesResult = await pool.query(
      `SELECT 
        m.id, m.file_url, m.media_type, m.created_at,
        cs.checkpoint_id, c.name as checkpoint_name,
        p.id as project_id, p.title as project_title
      FROM media m
      JOIN checkpoint_submissions cs ON cs.id = m.submission_id
      JOIN checkpoints c ON c.id = cs.checkpoint_id
      JOIN projects p ON p.id = c.project_id
      WHERE p.village_id = $1 AND m.type = 'image'
      ORDER BY m.created_at DESC
      LIMIT 50`,
      [id]
    );

    res.json({
      village,
      projects,
      checkpoint_images: imagesResult.rows,
    });
  } catch (error: any) {
    console.error('Get village analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Volunteer login
router.post('/volunteer/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await pool.query(
      'SELECT id, username, password_hash, full_name, phone, email, employee_id, assigned_villages, is_active FROM volunteers WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const volunteer = result.rows[0];

    if (!volunteer.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, volunteer.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get assigned village details
    let assignedVillageDetails: any[] = [];
    if (volunteer.assigned_villages && volunteer.assigned_villages.length > 0) {
      const detailsResult = await pool.query(
        'SELECT id, name FROM villages WHERE id = ANY($1::int[]) ORDER BY name',
        [volunteer.assigned_villages]
      );
      assignedVillageDetails = detailsResult.rows;
    }

    res.json({
      volunteer_id: volunteer.id.toString(),
      username: volunteer.username,
      full_name: volunteer.full_name,
      employee_id: volunteer.employee_id,
      assigned_villages: volunteer.assigned_villages || [],
      assigned_village_details: assignedVillageDetails,
    });
  } catch (error: any) {
    console.error('Volunteer login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get volunteer's assigned projects and checkpoints (no auth required - volunteer login handled separately)
router.get('/volunteer/:volunteerId/projects', async (req, res) => {
  try {
    const { volunteerId } = req.params;

    // Get volunteer's assigned villages
    const volunteerResult = await pool.query(
      'SELECT assigned_villages FROM volunteers WHERE id = $1',
      [volunteerId]
    );

    if (volunteerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    const assignedVillages = volunteerResult.rows[0].assigned_villages || [];

    if (assignedVillages.length === 0) {
      return res.json({ projects: [] });
    }

    // Get projects for assigned villages
    const projectsResult = await pool.query(
      `SELECT 
        p.id, p.title, p.project_type, p.status, p.village_id,
        v.name as village_name
      FROM projects p
      JOIN villages v ON v.id = p.village_id
      WHERE p.village_id = ANY($1::int[])
      ORDER BY p.created_at DESC`,
      [assignedVillages]
    );

    // Get checkpoints for each project
    for (const project of projectsResult.rows) {
      const checkpointsResult = await pool.query(
        `SELECT 
          id, name, description, sequence_order as checkpoint_order, is_mandatory, estimated_date
        FROM checkpoints
        WHERE project_id = $1
        ORDER BY sequence_order`,
        [project.id]
      );
      project.checkpoints = checkpointsResult.rows;
    }

    res.json({ projects: projectsResult.rows });
  } catch (error: any) {
    console.error('Get volunteer projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload checkpoint submission (images, audio, notes, location)
router.post('/checkpoint/:checkpointId/submit', upload.array('media', 10), async (req, res) => {
  console.log('\n========================================');
  console.log('📸 CHECKPOINT SUBMISSION RECEIVED');
  console.log('========================================');
  console.log('Checkpoint ID:', req.params.checkpointId);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Files received:', req.files ? (req.files as any[]).length : 0);
  if (req.files && Array.isArray(req.files)) {
    (req.files as any[]).forEach((file, index) => {
      console.log(`  File ${index + 1}:`, {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
    });
  }

  try {
    const { checkpointId } = req.params;
    const {
      volunteer_id,
      notes,
      location_lat,
      location_lng,
      client_id, // For offline sync
    } = req.body;

    if (!volunteer_id) {
      console.log('❌ Error: Missing volunteer_id');
      return res.status(400).json({ error: 'Volunteer ID is required' });
    }

    // Verify checkpoint exists
    const checkpointResult = await pool.query(
      'SELECT id, project_id FROM checkpoints WHERE id = $1',
      [checkpointId]
    );

    if (checkpointResult.rows.length === 0) {
      console.log('❌ Error: Checkpoint not found');
      return res.status(404).json({ error: 'Checkpoint not found' });
    }

    const checkpoint = checkpointResult.rows[0];
    console.log('✅ Checkpoint found:', checkpoint.id);

    // Create submission
    const submissionResult = await pool.query(
      `INSERT INTO checkpoint_submissions 
       (checkpoint_id, volunteer_id, notes, location_lat, location_lng, client_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [checkpointId, volunteer_id, notes || null, location_lat || null, location_lng || null, client_id || null]
    );

    const submission = submissionResult.rows[0];
    console.log('✅ Submission created:', submission.id);

    // Handle uploaded files
    const mediaFiles = [];
    if (req.files && Array.isArray(req.files)) {
      console.log(`📁 Processing ${(req.files as any[]).length} media files...`);
      for (const file of req.files as any[]) {
        // In production, upload to cloud storage (S3, etc.)
        // For now, store file path
        const fileUrl = `/uploads/${file.filename}`;
        console.log(`  Saving media: ${fileUrl}`);

        // Determine media type
        let mediaType = 'other';
        if (file.mimetype.startsWith('image/')) {
          mediaType = 'image'; // Frontend expects 'image'
          // Also set to 'photo' if analytics expects 'photo'? 
          // checkpoints.ts uses "m.media_type || m.type", and analytics uses "media_type = 'photo'"
          // Let's check schema again. migrate.ts says 'type'.
          // If I use 'image', analytics query "media_type = 'photo'" might fail if it uses 'type' column?
          // migrate.ts has "type VARCHAR".
          // checkpoints.ts analytics query: "WHERE ... m.media_type = 'photo'"
          // IF the column is 'type', then analytics query is WRONG unless 'media_type' is an alias or column exists.
          // But based on migrate.ts, column is 'type'.
          // So analytics query "m.media_type = 'photo'" should probably be "m.type = 'photo'".
          // However, for now, let's fix submission. Frontend uses 'image' or 'audio' (Projects.tsx).
          // Checkpoints.ts map: type: m.media_type || m.type.
          // So if I save as 'image', frontend gets 'image'.
          // If I save as 'photo', frontend 'image' check fails.
          // Projects.tsx: {m.type === 'image' && ...}
          // So I MUST save as 'image'.
        } else if (file.mimetype.startsWith('audio/')) {
          mediaType = 'audio';
        }

        const mediaResult = await pool.query(
          `INSERT INTO media (submission_id, url, type)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [
            submission.id,
            fileUrl,
            mediaType
          ]
        );
        console.log(`  ✅ Media saved to database:`, mediaResult.rows[0].id);
        mediaFiles.push(mediaResult.rows[0]);
      }
    } else {
      console.log('⚠️  No files in request');
    }

    console.log(`✅ Total media files saved: ${mediaFiles.length}`);
    console.log('========================================\n');

    res.json({
      message: 'Submission uploaded successfully',
      submission,
      media: mediaFiles,
    });
  } catch (error: any) {
    console.error('❌ Upload checkpoint submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending priority votes for a village (Volunteer)
router.get('/priority-votes/:villageId/pending', async (req, res) => {
  try {
    const { villageId } = req.params;
    const result = await pool.query(
      `SELECT * FROM village_priority_votes 
       WHERE village_id = $1 AND status = 'pending'
       ORDER BY total_votes DESC, submitted_at DESC`,
      [villageId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get pending priority votes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify priority vote (Volunteer)
router.post('/priority-votes/:voteId/verify', async (req, res) => {
  try {
    const { voteId } = req.params;
    const { volunteer_id, notes, status } = req.body; // status: 'verified' or 'rejected'

    if (!volunteer_id || !status) {
      return res.status(400).json({ error: 'Volunteer ID and status are required' });
    }

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE village_priority_votes 
       SET status = $1, volunteer_id = $2, verification_notes = $3
       WHERE id = $4
       RETURNING *`,
      [status, volunteer_id, notes || null, voteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Priority vote not found' });
    }

    res.json({ message: `Vote ${status} successfully`, vote: result.rows[0] });
  } catch (error: any) {
    console.error('Verify priority vote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

