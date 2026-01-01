import pool from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

const createTable = async () => {
    try {
        console.log('Creating village_simple_plans table...');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS village_simple_plans (
        id SERIAL PRIMARY KEY,
        village_id INTEGER NOT NULL REFERENCES villages(id),
        year INTEGER NOT NULL,
        
        -- Block A: Basic Info
        total_households INTEGER,
        total_population INTEGER,
        
        -- Block B: Population Highlights
        children_0_6 INTEGER,
        sc_population INTEGER,
        st_population INTEGER,
        literates INTEGER,
        
        -- Block C: Amenities Checklist (JSONB)
        amenities JSONB DEFAULT '{}',
        
        -- Block D: 5-Year Plan
        focus_areas JSONB DEFAULT '[]', -- Array of selected focus strings
        targets_text JSONB DEFAULT '{}', -- Key-value map: focus_area -> target_text
        remarks TEXT,
        
        -- Metadata
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Constraints
        UNIQUE(village_id, year)
      );
    `);

        console.log('village_simple_plans table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
};

createTable();
