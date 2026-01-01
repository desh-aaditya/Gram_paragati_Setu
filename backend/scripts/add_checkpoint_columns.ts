import pool from '../src/config/database';

async function addCheckpointColumns() {
    try {
        console.log('Adding missing columns to checkpoints table...');

        // Add is_mandatory column if it doesn't exist
        await pool.query(`
            ALTER TABLE checkpoints 
            ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT true
        `);
        console.log('✓ Added is_mandatory column');

        // Add estimated_date column if it doesn't exist
        await pool.query(`
            ALTER TABLE checkpoints 
            ADD COLUMN IF NOT EXISTS estimated_date DATE
        `);
        console.log('✓ Added estimated_date column');

        console.log('\n✅ Migration completed successfully!');
        await pool.end();
    } catch (error) {
        console.error('❌ Error adding columns:', error);
        await pool.end();
        process.exit(1);
    }
}

addCheckpointColumns();
