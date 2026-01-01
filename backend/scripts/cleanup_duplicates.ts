import pool from '../src/config/database';

async function cleanupDuplicates() {
    const client = await pool.connect();
    try {
        console.log('Cleaning up duplicate villages...');
        await client.query('BEGIN');

        // Find duplicates and delete the one with higher ID
        // We strictly want to delete the ones added by the recent seed if they are duplicates of original
        // This query deletes records that have a namesake with a lower ID
        const deleteQuery = `
      DELETE FROM villages a USING villages b
      WHERE a.id > b.id
      AND a.name = b.name
      AND a.district = b.district;
    `;

        const res = await client.query(deleteQuery);
        console.log(`Deleted ${res.rowCount} duplicate villages.`);

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Cleanup failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

cleanupDuplicates();
