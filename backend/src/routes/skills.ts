
import express from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/skills
 * @desc Add a new skill entry for a villager (Volunteer/Officer)
 */
// REMOVED authenticate middleware for testing mobile app submission ease
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            village_id,
            villager_name,
            contact_number,
            skill_category,
            skill_level,
            experience_years,
            availability,
            preferred_location,
            volunteer_id // Coming from body now
        } = req.body;

        // Optional: photo/video url from uploads
        const proof_url = req.body.proof_url || null;

        // Fallback validation for volunteer
        // If coming from mobile without auth header, we trust the body's volunteer_id (for prototype)
        // In prod, restore 'authenticate' and use (req as any).user.userId

        const isVolunteer = true; // Assuming mobile submission is from volunteer

        const result = await client.query(
            `INSERT INTO skill_bank (
        village_id, villager_name, contact_number, skill_category, skill_level, 
        experience_years, availability, preferred_location, verified_by_volunteer, 
        volunteer_id, proof_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [
                village_id,
                villager_name,
                contact_number,
                skill_category,
                skill_level,
                experience_years,
                availability,
                preferred_location,
                isVolunteer,
                volunteer_id, // Use body param
                proof_url
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding skill:', error);
        res.status(500).json({ message: 'Server error adding skill', error });
    } finally {
        client.release();
    }
});

/**
 * @route GET /api/skills/village/:villageId
 * @desc Get aggregated skill statistics for a village (Heatmap data)
 */
router.get('/village/:villageId', authenticate, async (req, res) => {
    const client = await pool.connect();
    try {
        const { villageId } = req.params;

        // 1. Count by Category (Bar/Pie Chart)
        const categoryStats = await client.query(
            `SELECT skill_category, COUNT(*) as count 
       FROM skill_bank 
       WHERE village_id = $1 
       GROUP BY skill_category 
       ORDER BY count DESC`,
            [villageId]
        );

        // 2. Count by Availability
        const availabilityStats = await client.query(
            `SELECT availability, COUNT(*) as count 
       FROM skill_bank 
       WHERE village_id = $1 
       GROUP BY availability`,
            [villageId]
        );

        // 3. Total Skilled Villagers
        const totalStats = await client.query(
            `SELECT COUNT(*) as total_skilled FROM skill_bank WHERE village_id = $1`,
            [villageId]
        );

        // 4. List of Skills (with details)
        const skillsList = await client.query(
            `SELECT * FROM skill_bank WHERE village_id = $1 ORDER BY created_at DESC`,
            [villageId]
        );

        res.json({
            categories: categoryStats.rows,
            availability: availabilityStats.rows,
            total: totalStats.rows[0].total_skilled,
            details: skillsList.rows
        });
    } catch (error) {
        console.error('Error fetching village skill stats:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

/**
 * @route GET /api/skills/matches/:villageId
 * @desc Auto-match villagers in this village to OPEN Job Postings
 */
router.get('/matches/:villageId', authenticate, async (req, res) => {
    const client = await pool.connect();
    try {
        const { villageId } = req.params;

        // Logic: Find jobs where required_skill matches villager's skill_category
        // We Group By Job Posting to show "3 Candidates available"

        const matches = await client.query(
            `SELECT 
        j.*, 
        COUNT(s.id) as potential_candidates,
        json_agg(json_build_object('name', s.villager_name, 'level', s.skill_level, 'exp', s.experience_years)) as candidates
       FROM job_postings j
       JOIN skill_bank s ON j.required_skill = s.skill_category
       WHERE s.village_id = $1 AND j.status = 'open'
       GROUP BY j.id`,
            [villageId]
        );

        res.json(matches.rows);
    } catch (error) {
        console.error('Error matching skills:', error);
        res.status(500).json({ message: 'Server error matching skills' });
    } finally {
        client.release();
    }
});

/**
 * @route POST /api/skills/jobs
 * @desc Create a new Job Posting (Officer/Admin) - For Demo Purposes
 */
router.post('/jobs', authenticate, async (req, res) => {
    const client = await pool.connect();
    try {
        const { title, required_skill, location, wage_per_day, is_government_project, description } = req.body;

        const result = await client.query(
            `INSERT INTO job_postings (title, required_skill, location, wage_per_day, is_government_project, description)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, required_skill, location, wage_per_day, is_government_project, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating job" });
    } finally {
        client.release();
    }
});

export default router;
