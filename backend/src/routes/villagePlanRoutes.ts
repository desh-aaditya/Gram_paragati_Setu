
import { Router } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/village-plan?village_id=1&year=2024
router.get('/', authenticate, async (req, res) => {
    try {
        const { village_id, year } = req.query;

        if (!village_id || !year) {
            return res.status(400).json({ message: 'village_id and year are required' });
        }

        const result = await pool.query(
            `SELECT * FROM village_simple_plans WHERE village_id = $1 AND year = $2`,
            [village_id, year]
        );

        if (result.rows.length === 0) {
            // Return null or specific message, frontend can handle "not found" as "create new"
            return res.status(200).json(null);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching village plan:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/village-plan
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            village_id,
            year,
            total_households,
            total_population,
            children_0_6,
            sc_population,
            st_population,
            literates,
            amenities,
            focus_areas,
            targets_text,
            remarks
        } = req.body;

        if (!village_id || !year) {
            return res.status(400).json({ message: 'village_id and year are required' });
        }

        const user_id = (req as any).user.userId;

        // Check if plan exists
        const existing = await pool.query(
            `SELECT id FROM village_simple_plans WHERE village_id = $1 AND year = $2`,
            [village_id, year]
        );

        let result;

        if (existing.rows.length > 0) {
            // Update
            result = await pool.query(
                `UPDATE village_simple_plans SET
                    total_households = $1,
                    total_population = $2,
                    children_0_6 = $3,
                    sc_population = $4,
                    st_population = $5,
                    literates = $6,
                    amenities = $7,
                    focus_areas = $8,
                    targets_text = $9,
                    remarks = $10,
                    updated_by = $11,
                    updated_at = CURRENT_TIMESTAMP
                WHERE village_id = $12 AND year = $13
                RETURNING *`,
                [
                    total_households,
                    total_population,
                    children_0_6,
                    sc_population,
                    st_population,
                    literates,
                    JSON.stringify(amenities || {}), // JSONB
                    JSON.stringify(focus_areas || []), // JSONB
                    JSON.stringify(targets_text || {}), // JSONB
                    remarks,
                    user_id,
                    village_id,
                    year
                ]
            );
        } else {
            // Insert
            result = await pool.query(
                `INSERT INTO village_simple_plans (
                    village_id, year, total_households, total_population,
                    children_0_6, sc_population, st_population, literates,
                    amenities, focus_areas, targets_text, remarks,
                    created_by, updated_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
                RETURNING *`,
                [
                    village_id, year, total_households, total_population,
                    children_0_6, sc_population, st_population, literates,
                    JSON.stringify(amenities || {}), JSON.stringify(focus_areas || []), JSON.stringify(targets_text || {}), remarks,
                    user_id
                ]
            );
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error saving village plan:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
