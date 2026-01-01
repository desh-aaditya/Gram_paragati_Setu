import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface VillagePlan {
    village_id: number;
    year: number;
    total_households?: number;
    total_population?: number;
    children_0_6?: number;
    sc_population?: number;
    st_population?: number;
    literates?: number;
    amenities: { [key: string]: boolean };
    focus_areas: string[];
    targets_text: { [key: string]: string };
    remarks?: string;
    updated_at?: string;
}

const VillagePlanVisuals: React.FC = () => {
    const { villageId, year } = useParams<{ villageId: string; year: string }>();
    const navigate = useNavigate();
    const [plan, setPlan] = useState<VillagePlan | null>(null);
    const [villageName, setVillageName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!villageId || !year) return;
            try {
                // Fetch Village Name
                const vRes = await fetch('http://localhost:5000/api/villages', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                });
                const vData = await vRes.json();
                const village = vData.find((v: any) => v.id === Number(villageId));
                if (village) setVillageName(village.name);

                // Fetch Plan
                const pRes = await fetch(`http://localhost:5000/api/village-plan?village_id=${villageId}&year=${year}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                });
                const pData = await pRes.json();
                setPlan(pData);
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [villageId, year]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#666' }}>Loading...</div>;

    if (!plan) return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2>No plan found for this village/year.</h2>
            <button onClick={() => navigate(-1)} style={{ marginTop: '1rem', padding: '0.8rem 1.5rem', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Go Back</button>
        </div>
    );

    const amenitiesList = [
        { key: 'drinking_water', label: 'Drinking Water', icon: '💧' },
        { key: 'handpump', label: 'Handpump', icon: '🔧' },
        { key: 'tap_water', label: 'Tap Water', icon: '🚰' },
        { key: 'electricity', label: 'Electricity', icon: '💡' },
        { key: 'primary_school', label: 'Primary School', icon: '🏫' },
        { key: 'secondary_school', label: 'Secondary School', icon: '🏫' },
        { key: 'higher_secondary', label: 'Higher Secondary', icon: '🎓' },
        { key: 'sub_centre', label: 'Health Sub-centre', icon: '🏥' },
        { key: 'phc', label: 'PHC', icon: '🏥' },
        { key: 'chc', label: 'CHC', icon: '🏥' },
        { key: 'anganwadi', label: 'Anganwadi', icon: '👶' },
        { key: 'ration_shop', label: 'Ration Shop', icon: '🏪' },
        { key: 'all_weather_road', label: 'Roads', icon: '🛣️' }
    ];

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
                <button onClick={() => navigate(-1)} style={{ marginBottom: '1rem', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                    ← Back to Edit
                </button>

                <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>{villageName} Village Plan</h1>
                    <div style={{ display: 'inline-block', background: '#e3f2fd', color: '#1565c0', padding: '0.5rem 1.5rem', borderRadius: '50px', fontWeight: 600, fontSize: '1.2rem' }}>
                        Year {year}
                    </div>
                    {plan.updated_at && <p style={{ color: '#888', marginTop: '1rem', fontSize: '0.9rem' }}>Last updated: {new Date(plan.updated_at).toLocaleDateString()}</p>}
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    {/* Demographics Card */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '1rem', marginBottom: '1rem', fontSize: '1.2rem', color: '#333' }}>📊 Demographics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Households</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333' }}>{plan.total_households || '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Population</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333' }}>{plan.total_population || '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Literates</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333' }}>{plan.literates || '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Children (0-6)</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333' }}>{plan.children_0_6 || '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Focus Areas Card */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '1rem', marginBottom: '1rem', fontSize: '1.2rem', color: '#333' }}>🎯 Priority Focus Areas</h3>
                        {plan.focus_areas && plan.focus_areas.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                {plan.focus_areas.map(area => (
                                    <span key={area} style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, textTransform: 'capitalize' }}>
                                        {area}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#999', fontStyle: 'italic' }}>No focus areas selected.</p>
                        )}

                        {plan.remarks && (
                            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>OFFICER REMARKS</div>
                                <p style={{ color: '#555', lineHeight: '1.6', fontStyle: 'italic' }}>"{plan.remarks}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Amenities Grid */}
                <h3 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '1.5rem', textAlign: 'center' }}>Infrastructure & Amenities</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {amenitiesList.map(item => {
                        const isPresent = plan.amenities && plan.amenities[item.key];
                        return (
                            <div key={item.key} style={{
                                background: isPresent ? 'white' : '#f9f9f9',
                                border: isPresent ? '2px solid #4caf50' : '1px dashed #ccc',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                opacity: isPresent ? 1 : 0.6
                            }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', filter: isPresent ? 'none' : 'grayscale(100%)' }}>{item.icon}</div>
                                <div style={{ fontWeight: 600, color: isPresent ? '#333' : '#999' }}>{item.label}</div>
                                <div style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: isPresent ? '#4caf50' : '#999',
                                    textTransform: 'uppercase'
                                }}>
                                    {isPresent ? 'Available' : 'Missing'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Targets Table */}
                {Object.keys(plan.targets_text || {}).length > 0 && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '1.5rem' }}>🚀 5-Year Targets</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', color: '#666', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #eee' }}>Focus Area</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #eee' }}>Target Goal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(plan.targets_text).map(([key, text]) => (
                                    <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600, color: '#333', textTransform: 'capitalize' }}>{key}</td>
                                        <td style={{ padding: '1rem', color: '#555' }}>{text}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </div>
    );
};

export default VillagePlanVisuals;
