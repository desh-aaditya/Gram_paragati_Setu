import pool from '../src/config/database';

async function testMedia() {
    try {
        console.log('--- Media Columns ---');
        const cols = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'media'
    `);
        console.log(JSON.stringify(cols.rows, null, 2));

        console.log('--- Test Insert ---');
        // Get a valid submission id
        const sub = await pool.query('SELECT id FROM checkpoint_submissions LIMIT 1');
        if (sub.rows.length === 0) {
            console.log('No submissions to test with');
            return;
        }
        const subId = sub.rows[0].id;
        console.log('Using submission id:', subId);

        try {
            await pool.query(
                'INSERT INTO media (submission_id, file_url) VALUES ($1, $2)',
                [subId, '/test.jpg']
            );
            console.log('Insert success!');
        } catch (e: any) {
            console.log('Insert failed:', e.message);
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        pool.end();
    }
}

testMedia();
