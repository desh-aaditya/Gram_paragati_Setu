import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicProjectTracker from './pages/PublicProjectTracker';
import './index.css';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/public/project/:token" element={<PublicProjectTracker />} />
                {/* Redirect root to a 404 or generic page if needed, for now maybe just a placeholder or nothing */}
                <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}>Page not found or invalid QR code.</div>} />
            </Routes>
        </Router>
    );
};

export default App;
