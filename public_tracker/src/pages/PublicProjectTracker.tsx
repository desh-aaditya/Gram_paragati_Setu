
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import './Manage.css';

interface PublicProject {
    id: number;
    title: string;
    description: string;
    project_type: string;
    status: string;
    allocated_amount: number;
    utilized_amount: number;
    start_date: string;
    end_date: string;
    village_name: string;
    updated_at: string;
    completion_percentage: number;
    checkpoints: {
        id: number;
        name: string;
        description: string;
        sequence_order: number;
        estimated_date: string;
        is_completed: boolean;
        completed_at: string | null;
    }[];
    recent_images: {
        image_url: string;
        created_at: string;
    }[];
}

const PublicProjectTracker: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [project, setProject] = useState<PublicProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            fetchProject();
        }
    }, [token]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/public/projects/${token}`);
            setProject(response.data);
        } catch (err: any) {
            console.error('Fetch error:', err);
            const status = err.response?.status;
            const msg = err.response?.data?.error || err.message;
            setError(`Failed to load project: ${msg} (${status || 'Network Error'})`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading project progress...</div>;
    if (error) return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
            <h3>Error Loading Project</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>Retry</button>
        </div>
    );
    if (!project) return null;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
            <header style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                <h1 style={{ color: '#003366', margin: '0 0 0.5rem 0' }}>Gram Pragati Setu</h1>
                <div style={{ color: '#666' }}>Project Transparency Portal</div>
            </header>

            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'start' }}>
                    <div>
                        <h2 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{project.title}</h2>
                        <div style={{ color: '#555', marginBottom: '0.5rem' }}>📍 {project.village_name}</div>
                        <div className={`status-badge ${project.status}`} style={{ display: 'inline-block' }}>{project.status}</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: '120px' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#003366' }}>{project.completion_percentage}%</div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Completed</div>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${project.completion_percentage}%`, background: '#4CAF50', height: '100%' }}></div>
                    </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', color: '#555' }}>
                    <div><strong>Type:</strong> {project.project_type}</div>
                    <div><strong>Started:</strong> {new Date(project.start_date).toLocaleDateString()}</div>
                </div>
            </div>

            {/* Fund Transparency Section */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#003366', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Fund Transparency</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Allocated Budget</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0277bd' }}>
                            ₹{(Number(project.allocated_amount) || 0).toLocaleString('en-IN')}
                        </div>
                    </div>
                    <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Amount Utilized</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2e7d32' }}>
                            ₹{(Number(project.utilized_amount) || 0).toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#555' }}>
                        <span>Utilization</span>
                        <span>{Math.round(((Number(project.utilized_amount) || 0) / (Number(project.allocated_amount) || 1)) * 100)}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(100, Math.round(((Number(project.utilized_amount) || 0) / (Number(project.allocated_amount) || 1)) * 100))}%`,
                            background: '#2e7d32',
                            height: '100%'
                        }}></div>
                    </div>
                </div>
            </div>

            <h3 style={{ borderLeft: '4px solid #003366', paddingLeft: '0.5rem', marginLeft: '0.5rem' }}>Current Progress</h3>
            <div style={{ margin: '1rem 0 2rem 0' }}>
                {project.checkpoints.map((cp, index) => (
                    <div key={cp.id} style={{ display: 'flex', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '1rem' }}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: cp.is_completed ? '#4CAF50' : '#ddd',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.8rem', fontWeight: 'bold', zIndex: 1
                            }}>
                                {cp.is_completed ? '✓' : index + 1}
                            </div>
                            {index < project.checkpoints.length - 1 && (
                                <div style={{ width: '2px', flex: 1, background: '#eee', margin: '4px 0' }}></div>
                            )}
                        </div>
                        <div style={{ paddingBottom: '1rem', flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: cp.is_completed ? '#333' : '#777' }}>
                                {cp.name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                                {cp.description}
                            </div>
                            {cp.is_completed && (
                                <div style={{ fontSize: '0.8rem', color: '#2e7d32', marginTop: '0.25rem' }}>
                                    Completed on {new Date(cp.completed_at!).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {project.recent_images && project.recent_images.length > 0 && (
                <>
                    <h3 style={{ borderLeft: '4px solid #003366', paddingLeft: '0.5rem', marginLeft: '0.5rem' }}>Recent Photos</h3>
                    <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', padding: '0.5rem 0 1rem 0' }}>
                        {project.recent_images.map((img, i) => (
                            <img
                                key={i}
                                src={img.image_url}
                                alt="Construction update"
                                style={{ height: '150px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                            />
                        ))}
                    </div>
                </>
            )}

            <footer style={{ marginTop: '3rem', textAlign: 'center', color: '#999', fontSize: '0.8rem', padding: '1rem', borderTop: '1px solid #eee' }}>
                Gram Pragati Setu &bull; Transparency in Development
            </footer>
        </div>
    );
};

export default PublicProjectTracker;
