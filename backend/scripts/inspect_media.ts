import pool from '../src/config/database';

async function checkMedia() {
    try {
        console.log('--- Checking Media Table Schema ---');
        const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'media'
      ORDER BY ordinal_position
    `);
        console.log(JSON.stringify(tableInfo.rows, null, 2));

        console.log('--- Checking Recent Media Rows ---');
        const res = await pool.query('SELECT * FROM media ORDER BY id DESC LIMIT 5');
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        pool.end();
    }
}

checkMedia();
