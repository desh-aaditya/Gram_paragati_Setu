import pool from '../src/config/database';

async function testMedia() {
    try {
        const dbInfo = await pool.query('SELECT current_database(), current_schema()');
        console.log('DB Connection:', dbInfo.rows[0]);

        console.log('--- Checking Media Table Existence ---');
        const tableCheck = await pool.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_name = 'media'
    `);
        console.log('Found tables:', tableCheck.rows);

        if (tableCheck.rows.length === 0) {
            console.log('CRITICAL: Media table NOT found!');
        } else {
            console.log('Media table found in schema:', tableCheck.rows[0].table_schema);

            // Explicitly specify schema
            const schema = tableCheck.rows[0].table_schema;
            const query = `INSERT INTO "${schema}"."media" (submission_id, file_url, type) VALUES ($1, $2, $3) RETURNING *`;
            console.log('Running query:', query);

            // Get a submission
            const sub = await pool.query('SELECT id FROM checkpoint_submissions LIMIT 1');
            if (sub.rows.length > 0) {
                const subId = sub.rows[0].id;
                const res = await pool.query(query, [subId, '/test_fixed.jpg', 'image']);
                console.log('Insert success! ID:', res.rows[0].id);
            } else {
                console.log('No submissions to test with');
            }
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        pool.end();
    }
}

testMedia();
