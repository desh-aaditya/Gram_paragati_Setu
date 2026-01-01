import pool from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

const updateSchema = async () => {
    try {
        console.log('Updating village_priority_votes schema...');

        // Add status column
        await pool.query(`
      ALTER TABLE village_priority_votes 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS volunteer_id INTEGER REFERENCES volunteers(id),
      ADD COLUMN IF NOT EXISTS verification_notes TEXT;
    `);

        console.log('Schema updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
};

updateSchema();
