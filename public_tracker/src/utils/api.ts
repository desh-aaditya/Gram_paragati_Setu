import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy will handle this
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
