import pool from '../src/config/database';
import fs from 'fs';

async function checkData() {
  try {
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'checkpoints'
    `);

    const output = `
Checkpoints Columns:
${JSON.stringify(columns.rows, null, 2)}
    `;

    fs.writeFileSync('debug_output.txt', output);
    console.log('Debug data written to debug_output.txt');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkData();
