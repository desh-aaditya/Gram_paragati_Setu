import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import pool from '../src/config/database';

async function testUpload() {
    let client;
    try {
        // 1. Ensure a volunteer exists
        client = await pool.connect();
        let volId;
        const volRes = await client.query('SELECT id FROM volunteers LIMIT 1');
        if (volRes.rows.length > 0) {
            volId = volRes.rows[0].id;
        } else {
            console.log('Creating dummy volunteer...');
            const newVol = await client.query(`
        INSERT INTO volunteers (username, password_hash, full_name, is_active)
        VALUES ('test_vol_${Date.now()}', 'hash', 'Test Volunteer', true)
        RETURNING id
      `);
            volId = newVol.rows[0].id;
        }
        console.log('Using Volunteer ID:', volId);

        // 2. Prepare Upload
        const formData = new FormData();
        formData.append('volunteer_id', volId.toString());
        formData.append('notes', 'Test submission from script');

        const filePath = path.join(__dirname, 'test_image.jpg');
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, 'dummy image data');
        }
        formData.append('media', fs.createReadStream(filePath));

        // 3. Upload
        const checkpointId = 1;
        const url = `http://localhost:5000/api/mobile/checkpoint/${checkpointId}/submit`;
        console.log(`Uploading to ${url}...`);

        const response = await axios.post(url, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        console.log('Response:', response.data);

    } catch (error: any) {
        if (error.response) {
            console.error('Upload Error Status:', error.response.status);
            console.error('Upload Error Data:', error.response.data);
        } else {
            console.error('Upload Error:', error.message);
        }
    } finally {
        if (client) client.release();
        pool.end();
    }
}

testUpload();
