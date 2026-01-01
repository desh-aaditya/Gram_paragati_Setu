import pool from '../src/config/database';

async function repair() {
  const client = await pool.connect();
  try {
    console.log('Repairing schema...');
    await client.query('BEGIN');

    // Add missing columns to checkpoint_submissions
    await client.query(`
      DO $$ 
      BEGIN
        -- volunteer_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkpoint_submissions' AND column_name = 'volunteer_id') THEN
          ALTER TABLE checkpoint_submissions ADD COLUMN volunteer_id INTEGER;
          ALTER TABLE checkpoint_submissions ADD CONSTRAINT checkpoint_submissions_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES volunteers(id);
          RAISE NOTICE 'Added volunteer_id column';
        END IF;

        -- notes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkpoint_submissions' AND column_name = 'notes') THEN
          ALTER TABLE checkpoint_submissions ADD COLUMN notes TEXT;
          RAISE NOTICE 'Added notes column';
        END IF;

        -- location_lat
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkpoint_submissions' AND column_name = 'location_lat') THEN
          ALTER TABLE checkpoint_submissions ADD COLUMN location_lat DECIMAL(10, 8);
          RAISE NOTICE 'Added location_lat column';
        END IF;

        -- location_lng
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkpoint_submissions' AND column_name = 'location_lng') THEN
          ALTER TABLE checkpoint_submissions ADD COLUMN location_lng DECIMAL(11, 8);
          RAISE NOTICE 'Added location_lng column';
        END IF;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('Schema repair completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Repair failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}

repair();
