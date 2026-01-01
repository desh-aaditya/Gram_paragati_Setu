
import pool from '../src/config/database';
import axios from 'axios';

async function verify() {
    try {
        // 1. Get a project with a token
        const result = await pool.query('SELECT id, public_token FROM projects WHERE public_token IS NOT NULL LIMIT 1');

        if (result.rows.length === 0) {
            console.error('❌ No projects with public_token found in DB!');
            return;
        }

        const { id, public_token } = result.rows[0];
        console.log(`✅ Found project ${id} with token: ${public_token}`);

        // 2. Try to fetch from API
        try {
            const url = `http://localhost:5000/api/public/projects/${public_token}`;
            console.log(`Testing API: ${url}`);
            const response = await axios.get(url);
            console.log('✅ API Response Status:', response.status);
            console.log('✅ API returned:', response.data.title);
        } catch (apiError: any) {
            console.error('❌ API Verification Failed:', apiError.message);
            if (apiError.response) {
                console.error('Response data:', apiError.response.data);
                console.error('Response status:', apiError.response.status);
            }
        }

    } catch (dbError) {
        console.error('❌ Database Query Failed:', dbError);
    } finally {
        pool.end();
    }
}

verify();
