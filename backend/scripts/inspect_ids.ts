import pool from '../src/config/database';

async function checkIds() {
    try {
        const vols = await pool.query('SELECT id FROM volunteers ORDER BY id');
        console.log('Volunteers IDs:', vols.rows.map(v => v.id));

        const constraints = await pool.query(`
      SELECT pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c 
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'checkpoint_submissions' AND c.conname LIKE '%volunteer%'
    `);
        console.log('FK Def:', constraints.rows[0]?.def);

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        pool.end();
    }
}

checkIds();
