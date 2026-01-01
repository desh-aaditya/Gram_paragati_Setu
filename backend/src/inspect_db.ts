import pool from './config/database';

async function inspect() {
    try {
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables:', res.rows.map(r => r.table_name));

        // Check columns for villages
        const villages = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'villages'
    `);
        console.log('Villages columns:', villages.rows.map(r => r.column_name));

        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

inspect();
