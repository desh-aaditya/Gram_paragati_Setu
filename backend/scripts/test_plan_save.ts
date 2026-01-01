import http from 'http';

function request(options: any, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseBody });
                }
            });
        });

        req.on('error', (error) => reject(error));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function run() {
    try {
        console.log('1. Logging in...');
        const loginRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: 'officer1', password: 'password123' });

        if (loginRes.status !== 200) {
            console.error('Login failed:', loginRes);
            return;
        }

        const token = loginRes.data.accessToken; // Check if it's accessToken or token. Auth route says accessToken.
        // Wait, AuthContext says: const { accessToken, user: userData } = response.data;
        // But my previous test_endpoint used login.data.token ???
        // Let's check auth.ts route return again.

        console.log('Login successful.');

        console.log('2. Saving Plan...');
        const payload = {
            village_id: 1, // Rampur (ID 1)
            year: 2025,
            total_households: 100,
            remarks: "Test remark from script",
            amenities: { "drinking_water": true, "school": false },
            focus_areas: ["health", "education"],
            targets_text: { "health": "Build a clinic", "education": "Repair school" }
        };

        const saveRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/village-plan',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, payload);

        console.log(`Save Status: ${saveRes.status}`);
        console.log('Save Response:', JSON.stringify(saveRes.data, null, 2));

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
