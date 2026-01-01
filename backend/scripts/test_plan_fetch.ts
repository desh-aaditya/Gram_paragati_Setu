import http from 'http';

function request(options: any): Promise<any> {
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
        req.end();
    });
}

function postRequest(options: any, body: any): Promise<any> {
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
        req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        console.log('1. Logging in...');
        const loginRes = await postRequest({
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

        const token = loginRes.data.accessToken;
        console.log('Login successful.');

        console.log('2. Fetching Plan for Village 1, Year 2025...');
        const fetchRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/village-plan?village_id=1&year=2025',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`Fetch Status: ${fetchRes.status}`);
        const plan = fetchRes.data;
        if (plan) {
            console.log('Amenities Type:', typeof plan.amenities);
            console.log('Amenities Data:', plan.amenities);
            console.log('Focus Areas Type:', Array.isArray(plan.focus_areas) ? 'Array' : typeof plan.focus_areas);
            console.log('Focus Areas Data:', plan.focus_areas);
        } else {
            console.log('No plan found (null).');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
