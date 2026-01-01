import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Village {
    id: number;
    name: string;
    code?: string;
}

interface VillagePlan {
    id?: number;
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
}

const VillagePlanUpdate: React.FC = () => {
    const [villages, setVillages] = useState<Village[]>([]);
    const [selectedVillageId, setSelectedVillageId] = useState<number | ''>('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const [formData, setFormData] = useState<VillagePlan>({
        village_id: 0,
        year: new Date().getFullYear(),
        amenities: {},
        focus_areas: [],
        targets_text: {},
        remarks: ''
    });

    const amenitiesList = [
        { key: 'drinking_water', label: 'Drinking Water' },
        { key: 'handpump', label: 'Handpump' },
        { key: 'tap_water', label: 'Tap Water' },
        { key: 'electricity', label: 'Electricity (Households mostly have electricity)' },
        { key: 'primary_school', label: 'Primary School' },
        { key: 'secondary_school', label: 'Secondary School' },
        { key: 'higher_secondary', label: 'Higher Secondary' },
        { key: 'sub_centre', label: 'Health Sub-centre' },
        { key: 'phc', label: 'PHC' },
        { key: 'chc', label: 'CHC' },
        { key: 'anganwadi', label: 'Anganwadi Centre' },
        { key: 'ration_shop', label: 'Ration Shop (PDS)' },
        { key: 'all_weather_road', label: 'All-weather Road' }
    ];

    const focusAreasList = [
        { key: 'water', label: 'Improve water' },
        { key: 'roads', label: 'Improve roads' },
        { key: 'education', label: 'Improve education' },
        { key: 'health', label: 'Improve health' },
        { key: 'livelihood', label: 'Improve livelihood / jobs' },
        { key: 'sanitation', label: 'Sanitation & cleanliness' },
        { key: 'other', label: 'Other' }
    ];

    const years = Array.from({ length: 8 }, (_, i) => 2023 + i);

    useEffect(() => {
        fetchVillages();
    }, []);

    useEffect(() => {
        if (selectedVillageId && selectedYear) {
            fetchVillagePlan(Number(selectedVillageId), selectedYear);
        }
    }, [selectedVillageId, selectedYear]);

    const fetchVillages = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/villages', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            });
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                setVillages(data);
            } else {
                console.error('Village data is invalid:', data);
                setVillages([]);
                setMessage('Failed to load villages list.');
            }
        } catch (error) {
            console.error('Error fetching villages:', error);
            setVillages([]);
            setMessage('Error loading villages.');
        }
    };

    const fetchVillagePlan = async (villageId: number, year: number) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/village-plan?village_id=${villageId}&year=${year}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            });
            const data = await response.json();

            if (data) {
                setFormData(data);
            } else {
                // Reset form for new entry, keeping village and year
                setFormData({
                    village_id: villageId,
                    year: year,
                    total_households: undefined,
                    total_population: undefined,
                    children_0_6: undefined,
                    sc_population: undefined,
                    st_population: undefined,
                    literates: undefined,
                    amenities: {},
                    focus_areas: [],
                    targets_text: {},
                    remarks: ''
                });
            }
        } catch (error) {
            console.error('Error fetching plan:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAmenityChange = (key: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: { ...prev.amenities, [key]: !prev.amenities[key] }
        }));
    };

    const handleFocusAreaChange = (key: string) => {
        setFormData(prev => {
            const exists = prev.focus_areas.includes(key);
            const newFocusAreas = exists
                ? prev.focus_areas.filter(k => k !== key)
                : [...prev.focus_areas, key];

            // Clean up target text if unchecked
            const newTargets = { ...prev.targets_text };
            if (exists) {
                delete newTargets[key];
            }

            return { ...prev, focus_areas: newFocusAreas, targets_text: newTargets };
        });
    };

    const handleTargetChange = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            targets_text: { ...prev.targets_text, [key]: value }
        }));
    };

    const handleSubmit = async (action: 'save' | 'saveNext') => {
        if (!selectedVillageId) {
            setMessage('Please select a village');
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const payload = { ...formData, village_id: Number(selectedVillageId), year: selectedYear };
            const response = await fetch('http://localhost:5000/api/village-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setMessage('Plan saved successfully!');
                if (action === 'saveNext') {
                    // Logic for next village: find current index, go to next
                    const currentIndex = villages.findIndex(v => v.id === Number(selectedVillageId));
                    if (currentIndex !== -1 && currentIndex < villages.length - 1) {
                        const nextVillage = villages[currentIndex + 1];
                        setSelectedVillageId(nextVillage.id);
                    } else {
                        setMessage('Plan saved. No more villages in the list.');
                    }
                }
            } else {
                const errData = await response.json();
                setMessage(`Failed to save plan. Status: ${response.status}. Error: ${errData.message || errData.error || 'Unknown error'}`);
                console.error('Save failed:', response.status, errData);
            }
        } catch (error: any) {
            console.error('Error saving plan:', error);
            setMessage(`Error saving plan: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <h1>Village Plan Update</h1>

            <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                <div className="form-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Select Village</label>
                        <select
                            value={selectedVillageId}
                            onChange={(e) => setSelectedVillageId(Number(e.target.value))}
                            style={{ width: '100%', padding: '0.5rem' }}
                        >
                            <option value="">-- Select Village --</option>
                            {villages.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ width: '120px' }}>
                        <label>Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            style={{ width: '100%', padding: '0.5rem' }}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ width: 'auto', display: 'flex', alignItems: 'flex-end' }}>
                        <button
                            className="btn-secondary"
                            onClick={() => navigate(`/village-plan-view/${selectedVillageId}/${selectedYear}`)}
                            disabled={!selectedVillageId}
                            title={!selectedVillageId ? "Select a village first" : "View Visual Report"}
                            style={{
                                height: '42px',
                                marginTop: '1.7rem',
                                background: selectedVillageId ? '#673ab7' : '#e0e0e0',
                                color: selectedVillageId ? 'white' : '#999',
                                border: 'none',
                                cursor: selectedVillageId ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0 1.5rem'
                            }}
                        >
                            <span>👁️</span> View Visual Plan
                        </button>
                    </div>
                </div>
            </div>

            {selectedVillageId ? (
                <div className="plan-form">

                    {/* Block A: Basic Info */}
                    <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                        <h3>Block A: Basic Info</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Village Name</label>
                                <input type="text" value={villages.find(v => v.id === selectedVillageId)?.name || ''} readOnly disabled style={{ background: '#f0f0f0' }} />
                            </div>
                            <div className="form-group">
                                <label>Total Households</label>
                                <input type="number" name="total_households" value={formData.total_households || ''} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Total Population</label>
                                <input type="number" name="total_population" value={formData.total_population || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    {/* Block B: Population Highlights */}
                    <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                        <h3>Block B: Population Highlights</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Children 0-6 years</label>
                                <input type="number" name="children_0_6" value={formData.children_0_6 || ''} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>SC Population</label>
                                <input type="number" name="sc_population" value={formData.sc_population || ''} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>ST Population</label>
                                <input type="number" name="st_population" value={formData.st_population || ''} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Literates</label>
                                <input type="number" name="literates" value={formData.literates || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    {/* Block C: Amenities Checklist */}
                    <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                        <h3>Block C: Amenities Checklist</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {amenitiesList.map(item => (
                                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={!!formData.amenities[item.key]}
                                        onChange={() => handleAmenityChange(item.key)}
                                        id={`chk-${item.key}`}
                                    />
                                    <label htmlFor={`chk-${item.key}`}>{item.label}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Block D: 5-Year Plan */}
                    <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                        <h3>Block D: 5-Year Plan</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <h4>1. Focus Areas</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                {focusAreasList.map(item => (
                                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.focus_areas.includes(item.key)}
                                            onChange={() => handleFocusAreaChange(item.key)}
                                            id={`focus-${item.key}`}
                                        />
                                        <label htmlFor={`focus-${item.key}`}>{item.label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {formData.focus_areas.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <h4>2. Short Targets</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Focus Area</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Target in 5 years</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.focus_areas.map(key => {
                                            const label = focusAreasList.find(f => f.key === key)?.label || key;
                                            return (
                                                <tr key={key}>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{label}</td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                        <input
                                                            type="text"
                                                            value={formData.targets_text[key] || ''}
                                                            onChange={(e) => handleTargetChange(key, e.target.value)}
                                                            placeholder="Enter short target..."
                                                            style={{ width: '100%', padding: '4px' }}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="form-group">
                            <label>3. Remarks / Notes</label>
                            <textarea
                                name="remarks"
                                value={formData.remarks || ''}
                                onChange={handleInputChange}
                                rows={3}
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button className="btn-secondary" onClick={() => navigate(`/village-plan-view/${selectedVillageId}/${selectedYear}`)} disabled={!selectedVillageId} style={{ marginRight: 'auto', background: '#2196f3', color: 'white', border: 'none' }}>
                            👁️ View Visual Plan
                        </button>
                        <button className="btn-secondary" onClick={() => handleSubmit('save')} disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button className="btn-primary" onClick={() => handleSubmit('saveNext')} disabled={loading}>
                            {loading ? 'Saving...' : 'Save & Next Village'}
                        </button>
                    </div>

                    {message && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: message.includes('Failed') ? '#ffebee' : '#e8f5e9', color: message.includes('Failed') ? '#c62828' : '#2e7d32', borderRadius: '4px' }}>
                            {message}
                        </div>
                    )}

                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    <p>Please select a village to view or update its plan.</p>
                </div>
            )}
        </div>
    );
};

export default VillagePlanUpdate;
