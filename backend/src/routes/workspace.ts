
import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get Workspace for a Project (Auto-create if not exists)
router.get('/project/:projectId', authenticate, async (req: AuthRequest, res) => {
    try {
        const { projectId } = req.params;

        // Check if project exists and is sanctioned
        const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const project = projectResult.rows[0];

        // Check if workspace exists
        let workspaceResult = await pool.query('SELECT * FROM workspaces WHERE project_id = $1', [projectId]);

        if (workspaceResult.rows.length === 0) {
            // Create workspace if it doesn't exist
            let department = 'General Administration';
            if (project.project_type === 'healthcare') department = 'Health Department';
            if (project.project_type === 'education') department = 'Education Department';
            if (project.project_type === 'infrastructure') department = 'Public Works Department';

            workspaceResult = await pool.query(
                'INSERT INTO workspaces (project_id, department) VALUES ($1, $2) RETURNING *',
                [projectId, department]
            );
        }

        const workspace = workspaceResult.rows[0];
        res.json(workspace);

    } catch (error: any) {
        console.error('Get workspace error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Messages
router.get('/:id/messages', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT wm.*, u.full_name as sender_name, u.role as sender_role 
       FROM workspace_messages wm
       JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = $1
       ORDER BY wm.created_at ASC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

// Clear Messages
router.delete('/:id/messages', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM workspace_messages WHERE workspace_id = $1', [id]);
        res.json({ message: 'Chat cleared' });
    } catch (error) {
        res.status(500).json({ error: 'Error clearing chat' });
    }
});

// Send Message
router.post('/:id/messages', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message) return res.status(400).json({ error: 'Message is required' });

        const result = await pool.query(
            `INSERT INTO workspace_messages (workspace_id, user_id, message) 
       VALUES ($1, $2, $3) 
       RETURNING *, (SELECT full_name FROM users WHERE id = $2) as sender_name, (SELECT role FROM users WHERE id = $2) as sender_role`,
            [id, req.user!.userId, message]
        );

        // Auto-reply logic removed from backend to prevent duplicates/errors.
        // Frontend now handles the simulation of the reply for immediate user feedback.

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Error sending message' });
    }
});

// Get Documents
router.get('/:id/documents', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT wd.*, u.full_name as uploader_name 
       FROM workspace_documents wd
       JOIN users u ON u.id = wd.uploaded_by
       WHERE wd.workspace_id = $1
       ORDER BY wd.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

// Upload Document info
router.post('/:id/documents', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { name, url, type } = req.body;

        if (!name || !url) return res.status(400).json({ error: 'Name and URL are required' });

        const result = await pool.query(
            `INSERT INTO workspace_documents (workspace_id, name, url, type, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *, (SELECT full_name FROM users WHERE id = $5) as uploader_name`,
            [id, name, url, type || 'file', req.user!.userId]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error uploading document' });
    }
});

// Timeline Endpoint
router.get('/:id/timeline', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        // Fetch messages
        const messagesRes = await pool.query(
            `SELECT wm.id, 'message' as type, wm.message as content, wm.created_at, u.full_name as actor_name, u.role as actor_role
             FROM workspace_messages wm
             JOIN users u ON u.id = wm.user_id
             WHERE wm.workspace_id = $1`, [id]
        );
        const docsRes = await pool.query(
            `SELECT wd.id, 'document' as type, wd.name as content, wd.created_at, u.full_name as actor_name, u.role as actor_role
             FROM workspace_documents wd
             JOIN users u ON u.id = wd.uploaded_by
             WHERE wd.workspace_id = $1`, [id]
        );

        const timeline = [
            ...messagesRes.rows,
            ...docsRes.rows
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        res.json(timeline);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching timeline' });
    }
});

// External Data
router.get('/:id/external-data', authenticate, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const ws = await pool.query('SELECT department FROM workspaces WHERE id = $1', [id]);
    const dept = ws.rows[0]?.department || 'General';

    const data: any = {
        department: dept,
        timestamp: new Date(),
        stats: [
            { label: 'Total Budget (Dept)', value: '₹50 Cr' },
            { label: 'Active Projects in District', value: 12 },
            { label: 'Pending Approvals', value: 3 }
        ],
        fund_flow: [
            { stage: 'Sanctioned', status: 'completed', date: '2024-11-01' },
            { stage: 'Processed', status: 'completed', date: '2024-11-15' },
            { stage: 'Released', status: 'in_progress', date: '2024-12-01' },
            { stage: 'Disbursed', status: 'pending', date: null }
        ],
        schemes: [
            { name: 'Samagra Shiksha', benefit: 'Infrastructure Grants' },
            { name: 'PM Shri Schools', benefit: 'Upgradation Funds' }
        ],
        recent_notices: [
            { title: 'Q4 Guidelines released', date: '2025-11-20' },
            { title: 'Safety audit mandatory', date: '2025-12-01' }
        ]
    };

    if (dept.includes('Health')) {
        data.schemes = [
            { name: 'Ayushman Bharat', benefit: 'Health Infrastructure' },
            { name: 'National Health Mission', benefit: 'Equipment Support' }
        ];
    }

    res.json(data);
});

export default router;
