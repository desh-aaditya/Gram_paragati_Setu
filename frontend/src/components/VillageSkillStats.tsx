
import React, { useEffect, useState } from 'react';
import {
    MdWork,
    MdHandyman,
    MdAgriculture,
    MdDirectionsCar,
    MdHealthAndSafety,
    MdComputer,
    MdCheckCircle
} from 'react-icons/md';
import {
    PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../utils/api';

interface SkillStat {
    skill_category: string;
    count: string;
}

interface JobMatch {
    id: number;
    title: string;
    required_skill: string;
    location: string;
    wage_per_day: number;
    is_government_project: boolean;
    potential_candidates: string; // aggregated count
    candidates: { name: string, level: string, exp: number }[];
}

interface Props {
    villageId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const VillageSkillStats: React.FC<Props> = ({ villageId }) => {
    const [skillStats, setSkillStats] = useState<SkillStat[]>([]);
    const [matches, setMatches] = useState<JobMatch[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        villager_name: '',
        contact_number: '',
        skill_category: 'Construction',
        skill_level: 'Beginner',
        experience_years: 0,
        availability: 'Full-time'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [villageId]);

    const fetchData = async () => {
        try {
            const statsRes = await api.get(`/skills/village/${villageId}`);
            setSkillStats(statsRes.data.categories);

            const matchRes = await api.get(`/skills/matches/${villageId}`);
            setMatches(matchRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/skills', {
                ...formData,
                village_id: villageId,
                volunteer_id: 'WEB-OFFICER' // Placeholder for web entry
            });
            setShowAddModal(false);
            setFormData({
                villager_name: '',
                contact_number: '',
                skill_category: 'Construction',
                skill_level: 'Beginner',
                experience_years: 0,
                availability: 'Full-time'
            });
            alert('Skill entry added successfully!');
            fetchData(); // Refresh data
        } catch (error) {
            console.error(error);
            alert('Failed to add skill entry');
        } finally {
            setSubmitting(false);
        }
    };

    const getIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'construction': return <MdHandyman />;
            case 'agriculture': return <MdAgriculture />;
            case 'driving': return <MdDirectionsCar />;
            case 'healthcare': return <MdHealthAndSafety />;
            case 'tailoring': return <MdWork />;
            default: return <MdComputer />;
        }
    };

    const [showJobModal, setShowJobModal] = useState(false);
    const [jobData, setJobData] = useState({
        title: '',
        required_skill: 'Construction',
        location: '',
        wage_per_day: 0,
        is_government_project: false,
        description: ''
    });

    const handlePostJob = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/skills/jobs', jobData);
            setShowJobModal(false);
            setJobData({
                title: '',
                required_skill: 'Construction',
                location: '',
                wage_per_day: 0,
                is_government_project: false,
                description: ''
            });
            alert('Job Posted Successfully!');
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Failed to post job');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading Skill Intelligence...</div>;

    return (
        <div className="skill-dashboard-container">
            {/* 1. Skill Heatmap / Distribution */}
            <section className="skill-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3><MdWork /> Village Skill Bank High-Level View</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setShowAddModal(true)}
                            style={{
                                background: '#673ab7', color: 'white', border: 'none',
                                padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
                            }}
                        >
                            + Add Villager
                        </button>
                    </div>
                </div>

                <div className="charts-row" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>

                    {/* Pie Chart */}
                    <div className="chart-card" style={{ flex: 1, minWidth: '300px', background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h4>Skill Distribution</h4>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={skillStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="skill_category"
                                    >
                                        {skillStats.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <PieTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart (Availability) */}
                    <div className="chart-card" style={{ flex: 1, minWidth: '300px', background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h4>Top Skills</h4>
                        <ul>
                            {skillStats.map((s, i) => (
                                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid #eee' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {getIcon(s.skill_category)} {s.skill_category}
                                    </span>
                                    <span className="badge badge-blue">{s.count} Villagers</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* 2. Employment Matching Engine */}
            <section className="matching-section" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3><MdCheckCircle /> AI Job Matching Engine</h3>
                    <button
                        onClick={() => setShowJobModal(true)}
                        style={{
                            background: '#059669', color: 'white', border: 'none',
                            padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
                        }}
                    >
                        + Post New Job
                    </button>
                </div>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                    System automatically matches local skills with available Government & Private projects.
                </p>

                <div className="matches-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {matches.map(job => (
                        <div key={job.id} className="job-match-card" style={{
                            background: job.is_government_project ? '#ecfdf5' : 'white',
                            border: job.is_government_project ? '1px solid #34d399' : '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            position: 'relative'
                        }}>
                            {job.is_government_project && (
                                <span style={{ position: 'absolute', top: 10, right: 10, background: '#10b981', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px' }}>
                                    GOVT PROJECT
                                </span>
                            )}

                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>{job.title}</h4>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                                <MdDirectionsCar style={{ verticalAlign: 'middle' }} /> {job.location} • ₹{job.wage_per_day}/day
                            </p>

                            <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.6)', padding: '0.8rem', borderRadius: '8px' }}>
                                <strong style={{ color: '#059669', display: 'block', marginBottom: '0.5rem' }}>
                                    {job.potential_candidates} Candidates Matched!
                                </strong>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {job.candidates.slice(0, 3).map((c, i) => (
                                        <span key={i} style={{ fontSize: '0.8rem', background: 'white', border: '1px solid #ddd', padding: '2px 6px', borderRadius: '4px' }}>
                                            {c.name} ({c.level})
                                        </span>
                                    ))}
                                    {parseInt(job.potential_candidates) > 3 && (
                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>+{parseInt(job.potential_candidates) - 3} more</span>
                                    )}
                                </div>
                            </div>

                            <button style={{
                                marginTop: '1rem', width: '100%', padding: '0.6rem',
                                background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                            }}>
                                Employ Villagers
                            </button>
                        </div>
                    ))}

                    {matches.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb', gridColumn: '1 / -1', borderRadius: '12px' }}>
                            No pending job matches found for this village's skill set.
                        </div>
                    )}
                </div>
            </section>

            {/* Add Skill Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0 }}>Add New Skilled Villager</h3>
                        <form onSubmit={handleAddSkill} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555' }}>Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.villager_name}
                                    onChange={e => setFormData({ ...formData, villager_name: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555' }}>Contact Number</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.contact_number}
                                    onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555' }}>Category</label>
                                    <select
                                        value={formData.skill_category}
                                        onChange={e => setFormData({ ...formData, skill_category: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        <option>Construction</option>
                                        <option>Agriculture</option>
                                        <option>Tailoring</option>
                                        <option>Healthcare</option>
                                        <option>Driving</option>
                                        <option>Education</option>
                                        <option>Technology</option>
                                        <option>Handicrafts</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555' }}>Level</label>
                                    <select
                                        value={formData.skill_level}
                                        onChange={e => setFormData({ ...formData, skill_level: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Expert</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555' }}>Experience (Years)</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        value={formData.experience_years}
                                        onChange={e => setFormData({ ...formData, experience_years: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555' }}>Availability</label>
                                    <select
                                        value={formData.availability}
                                        onChange={e => setFormData({ ...formData, availability: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        <option>Full-time</option>
                                        <option>Part-time</option>
                                        <option>Seasonal</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    style={{ flex: 1, padding: '10px', background: '#f5f5f5', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ flex: 1, padding: '10px', background: '#673ab7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
                                >
                                    {submitting ? 'Adding...' : 'Add Villager'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Post Job Modal */}
            {showJobModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0 }}>Post New Job Opportunity</h3>
                        <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555' }}>Job Title</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g., Road Construction, School Repair"
                                    value={jobData.title}
                                    onChange={e => setJobData({ ...jobData, title: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555' }}>Required Skill</label>
                                <select
                                    value={jobData.required_skill}
                                    onChange={e => setJobData({ ...jobData, required_skill: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                >
                                    <option>Construction</option>
                                    <option>Agriculture</option>
                                    <option>Tailoring</option>
                                    <option>Healthcare</option>
                                    <option>Driving</option>
                                    <option>Education</option>
                                    <option>Technology</option>
                                    <option>Handicrafts</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555' }}>Location</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Village Center"
                                        value={jobData.location}
                                        onChange={e => setJobData({ ...jobData, location: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555' }}>Wage (₹/Day)</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        value={jobData.wage_per_day}
                                        onChange={e => setJobData({ ...jobData, wage_per_day: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="govtProject"
                                    checked={jobData.is_government_project}
                                    onChange={e => setJobData({ ...jobData, is_government_project: e.target.checked })}
                                />
                                <label htmlFor="govtProject" style={{ cursor: 'pointer' }}>Is Government Project?</label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowJobModal(false)}
                                    style={{ flex: 1, padding: '10px', background: '#f5f5f5', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ flex: 1, padding: '10px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
                                >
                                    {submitting ? 'Posting...' : 'Post Job'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VillageSkillStats;
