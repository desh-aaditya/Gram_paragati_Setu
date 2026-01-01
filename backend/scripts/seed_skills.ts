
import pool from '../src/config/database';

async function seedSkills() {
    const client = await pool.connect();
    try {
        console.log('Seeding Skill Bank & Jobs...');

        // 1. Get a village ID (Assuming 1 exists)
        const villageRes = await client.query('SELECT id FROM villages LIMIT 1');
        if (villageRes.rows.length === 0) {
            console.log('No villages found. skipping.');
            return;
        }
        const villageId = villageRes.rows[0].id;

        // 2. Insert Villagers with Skills
        const skills = [
            ['Ramesh Kumar', 'Construction', 'Expert', 10, 'Full-time'],
            ['Suresh Singh', 'Construction', 'Intermediate', 3, 'Full-time'],
            ['Anita Devi', 'Tailoring', 'Expert', 15, 'Part-time'],
            ['Geeta Kumari', 'Tailoring', 'Beginner', 1, 'Part-time'],
            ['Vijay Yadav', 'Driving', 'Expert', 8, 'Full-time'],
            ['Dr. Mohan', 'Healthcare', 'Expert', 5, 'Part-time'], // Health Assistant
            ['Raju Worker', 'Agriculture', 'Intermediate', 20, 'Full-time'],
            ['Sunil Electrician', 'Construction', 'Expert', 7, 'Full-time'], // Another construction type
        ];

        for (const s of skills) {
            await client.query(`
                INSERT INTO skill_bank (village_id, villager_name, skill_category, skill_level, experience_years, availability, verified_by_volunteer)
                VALUES ($1, $2, $3, $4, $5, $6, true)
             `, [villageId, s[0], s[1], s[2], s[3], s[4]]);
        }
        console.log('Inserted 8 skilled villagers.');

        // 3. Insert Job Postings
        const jobs = [
            ['School Renovation Project', 'Construction', 'Village Center', 500, true], // Matches 3 people
            ['Mask Sewing Contract', 'Tailoring', 'District HQ', 300, false], // Matches 2 people
            ['Driver for Panchayat Vehicle', 'Driving', 'Village', 400, true] // Matches 1 person
        ];

        for (const j of jobs) {
            await client.query(`
                INSERT INTO job_postings (title, required_skill, location, wage_per_day, is_government_project)
                VALUES ($1, $2, $3, $4, $5)
            `, j);
        }
        console.log('Inserted 3 job postings.');

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}
seedSkills();
