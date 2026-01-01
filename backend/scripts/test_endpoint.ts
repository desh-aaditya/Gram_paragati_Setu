import http from 'http';

function postRequest(path: string, body: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

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
        req.write(data);
        req.end();
    });
}

function getRequest(path: string, token: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

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

async function run() {
    try {
        console.log('Logging in...');
        const login = await postRequest('/api/auth/login', { username: 'officer1', password: 'password123' });
        if (login.status !== 200) {
            console.error('Login failed:', login);
            return;
        }
        const token = login.data.token;
        console.log(`Login response status: ${login.status}`);
        console.log('Token received:', token);
        console.log('Token Type:', typeof token);

        console.log('Fetching villages...');
        console.log(`Sending Header: Authorization: Bearer ${token}`);
        const villages = await getRequest('/api/villages', token);
        console.log(`Status: ${villages.status}`);
        if (villages.status !== 200) {
            console.log('Error Body:', JSON.stringify(villages.data, null, 2));
        }
        console.log('Is Array:', Array.isArray(villages.data));
        if (Array.isArray(villages.data)) {
            console.log('Count:', villages.data.length);
            villages.data.forEach((v: any) => console.log(`- ${v.name} (Active: ${v.is_active})`));
        } else {
            console.log('Data:', villages.data);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
