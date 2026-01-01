import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MdAdd, MdClose, MdCheckCircle, MdSchedule, MdInfo } from 'react-icons/md';
import { DEFAULT_CHECKPOINTS } from '../constants/projectCheckpoints';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './Projects.css';

interface Project {
  id: number;
  title: string;
  description?: string;
  project_type: string;
  status: string;
  allocated_amount: number;
  utilized_amount: number;
  village_name: string;
  village_id: number;
  checkpoints?: Checkpoint[];
  completion_percentage?: number;
  total_checkpoints?: number;
  completed_checkpoints?: number;
}

interface Checkpoint {
  id: number;
  name: string;
  description?: string;
  sequence_order: number;
  is_mandatory: boolean;
  estimated_date?: string;
  submission_count?: number;
  approved_count?: number;
}

interface Submission {
  id: number;
  status: string;
  submitted_by: string;
  submitted_at: string;
  review_notes?: string;
  media?: {
    id: number;
    url: string;
    type: string;
  }[];
}

const Projects: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  // const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetails, setShowDetails] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'checkpoints'>('overview');
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    village_id: '',
    title: '',
    description: '',
    project_type: '',
    allocated_amount: '',
    start_date: '',
    end_date: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submissionsByCheckpoint, setSubmissionsByCheckpoint] = useState<Record<number, Submission[]>>({});
  const [reviewLoadingId, setReviewLoadingId] = useState<number | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Array<{ name: string; description: string; is_mandatory: boolean; completion_percentage?: number; estimated_date: string }>>([]);

  // Auto-calculate checkpoint dates when start/end date or type changes
  useEffect(() => {
    if (!formData.project_type || !DEFAULT_CHECKPOINTS[formData.project_type]) return;

    const defaults = DEFAULT_CHECKPOINTS[formData.project_type];

    // If we have start and end dates, calculate based on percentage
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const duration = end.getTime() - start.getTime();

      if (duration > 0) {
        const newCheckpoints = defaults.map(cp => {
          const offsetMs = duration * (cp.completion_percentage / 100);
          const date = new Date(start.getTime() + offsetMs);
          return {
            name: cp.name,
            description: cp.description,
            is_mandatory: cp.is_mandatory,
            completion_percentage: cp.completion_percentage,
            estimated_date: date.toISOString().split('T')[0]
          };
        });
        setCheckpoints(newCheckpoints);
        return;
      }
    }

    // Fallback: If only start date, use a default duration (e.g. 1 day per 1%)
    // Or just list them without dates if dates are invalid
    const newCheckpoints = defaults.map(cp => {
      let estimatedDate = '';
      if (formData.start_date) {
        // Default assumption: 100 days project if no end date
        const start = new Date(formData.start_date);
        start.setDate(start.getDate() + cp.completion_percentage);
        estimatedDate = start.toISOString().split('T')[0];
      }
      return {
        name: cp.name,
        description: cp.description,
        is_mandatory: cp.is_mandatory,
        completion_percentage: cp.completion_percentage,
        estimated_date: estimatedDate
      };
    });
    setCheckpoints(newCheckpoints);

  }, [formData.start_date, formData.end_date, formData.project_type]);

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'officer') {
      fetchVillages();
    }
  }, [selectedVillageId]); // Re-fetch when village changes

  // Auto-select first village when villages load
  useEffect(() => {
    if (villages.length > 0 && selectedVillageId === null) {
      setSelectedVillageId(villages[0].id);
    }
  }, [villages]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const url = selectedVillageId
        ? `/projects?village_id=${selectedVillageId}`
        : '/projects';
      const response = await api.get(url);
      setProjects(response.data);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      let errorMessage = 'Failed to fetch projects';

      if (error.response) {
        if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          errorMessage = error.response?.data?.error
            || error.response?.data?.message
            || `Server error (${error.response.status}). Please try again.`;
        }
      } else if (error.request) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchVillages = async () => {
    try {
      const response = await api.get('/villages');
      setVillages(response.data);
    } catch (error) {
      console.error('Error fetching villages:', error);
    }
  };


  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.village_id || !formData.title || !formData.allocated_amount) {
      setError('Village, Title, and Allocated Amount are required');
      return;
    }

    let projectId = null;

    try {
      console.log('Creating project with data:', formData);
      const projectResponse = await api.post('/projects', {
        ...formData,
        allocated_amount: parseFloat(formData.allocated_amount),
      });

      projectId = projectResponse.data.id || projectResponse.data.project?.id;
      console.log('✅ Project created successfully, ID:', projectId);

    } catch (error: any) {
      console.error('❌ Error creating project:', error);
      const errorMessage = error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to create project';
      setError(errorMessage);
      return; // Stop here if project creation failed
    }

    // If we get here, the project was created successfully!
    // Now try to create checkpoints, but don't let failures stop us

    let checkpointWarning = '';
    if (checkpoints.length > 0 && projectId) {
      console.log(`Attempting to create ${checkpoints.length} checkpoints...`);
      let failedCount = 0;

      for (let i = 0; i < checkpoints.length; i++) {
        const checkpoint = checkpoints[i];
        try {
          await api.post(`/projects/${projectId}/checkpoints`, {
            name: checkpoint.name,
            description: checkpoint.description,
            sequence_order: i + 1,
            is_mandatory: checkpoint.is_mandatory,
            estimated_date: checkpoint.estimated_date || null,
          });
          console.log(`✅ Checkpoint ${i + 1} created`);
        } catch (cpError: any) {
          failedCount++;
          console.warn(`⚠️  Checkpoint ${i + 1} failed:`, cpError.response?.data?.error || cpError.message);
        }
      }

      if (failedCount > 0) {
        checkpointWarning = ` (${failedCount}/${checkpoints.length} checkpoints failed to create)`;
      }
    }

    // ALWAYS close form and show success since project was created
    console.log('Closing form and showing success...');
    setShowAddForm(false);
    setFormData({ village_id: '', title: '', description: '', project_type: '', allocated_amount: '', start_date: '', end_date: '' });
    setCheckpoints([]);

    // Show success message
    setSuccessMessage('Project created successfully!' + checkpointWarning);

    // Refresh projects list to show the new project
    try {
      await fetchProjects();
      console.log('✅ Projects list refreshed');
    } catch (refreshError) {
      console.warn('⚠️  Failed to refresh projects list:', refreshError);
    }

    // Clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleAddCheckpoint = () => {
    setCheckpoints([...checkpoints, { name: '', description: '', is_mandatory: true, estimated_date: '' }]);
  };

  const handleRemoveCheckpoint = (index: number) => {
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  const handleCheckpointChange = (index: number, field: string, value: string | boolean) => {
    const updated = [...checkpoints];
    updated[index] = { ...updated[index], [field]: value };
    setCheckpoints(updated);
  };

  const handleViewDetails = async (project: Project) => {
    try {
      setDetailsLoading(true);
      setShowDetails(project); // Show basic info immediately
      console.log('Fetching details for project:', project.id);
      const response = await api.get(`/projects/${project.id}`);
      console.log('Project details received:', response.data);
      setShowDetails(response.data);
      setActiveTab('overview');
      setSubmissionsByCheckpoint({});
    } catch (error: any) {
      console.error('Error fetching project details:', error);
      setError(error.response?.data?.error || 'Failed to fetch project details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const loadSubmissions = async (checkpointId: number) => {
    try {
      const response = await api.get(`/checkpoints/${checkpointId}/submissions`);
      setSubmissionsByCheckpoint((prev) => ({
        ...prev,
        [checkpointId]: response.data,
      }));
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      setError(error.response?.data?.error || 'Failed to fetch submissions');
    }
  };

  const reviewSubmission = async (
    checkpointId: number,
    submission: Submission,
    status: 'approved' | 'rejected' | 'requires_revision'
  ) => {
    const review_notes = window.prompt('Optional comment for this review:', '') || undefined;
    setReviewLoadingId(submission.id);
    try {
      await api.post(`/checkpoints/${checkpointId}/submissions/${submission.id}/review`, {
        status,
        review_notes,
      });

      // Refresh submissions for this checkpoint and the project list
      await loadSubmissions(checkpointId);
      await fetchProjects();
      if (showDetails) {
        await handleViewDetails(showDetails);
      }
    } catch (error: any) {
      console.error('Error reviewing submission:', error);
      setError(error.response?.data?.error || 'Failed to review submission');
    } finally {
      setReviewLoadingId(null);
    }
  };

  if (loading && projects.length === 0) {
    return <div className="projects-loading">{t('common.loading')}</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'on_hold': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>{t('projects.title')}</h1>
          {user?.role === 'employee' && (
            <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9em' }}>
              Click "View Details" on any project to review checkpoint submissions and approve/reject them
            </p>
          )}
        </div>
        {user?.role === 'officer' && (
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <MdAdd /> {t('projects.addProject')}
          </button>
        )}
      </div>

      {/* Village Selector for Officers */}
      {user?.role === 'officer' && villages.length > 0 && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <label htmlFor="village-select" style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#495057'
          }}>
            Select Village:
          </label>
          <select
            id="village-select"
            value={selectedVillageId || ''}
            onChange={(e) => setSelectedVillageId(Number(e.target.value))}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '0.5rem',
              fontSize: '1rem',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              cursor: 'pointer'
            }}
          >
            <option value="">All Villages</option>
            {villages.map((village) => (
              <option key={village.id} value={village.id}>
                {village.name} - {village.district}, {village.state}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message" style={{ marginBottom: '1rem', padding: '1rem', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', border: '1px solid #4caf50' }} role="alert">
          ✓ {successMessage}
        </div>
      )}

      {/* Main page tabs */}
      <div style={{ borderBottom: '1px solid #ddd', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            border: 'none',
            background: activeTab === 'overview' ? '#003366' : 'transparent',
            color: activeTab === 'overview' ? '#fff' : '#003366',
            padding: '0.5rem 1rem',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer'
          }}
        >
          All Projects
        </button>
      </div>


      {/* Overview tab content - show projects grid */}
      {activeTab === 'overview' && !showDetails && (
        <>
          {showAddForm && (
            <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Add Project</h2>
                  <button className="modal-close" onClick={() => setShowAddForm(false)}>
                    <MdClose />
                  </button>
                </div>
                <form onSubmit={handleAddProject} className="project-form">
                  <div className="form-group">
                    <label>Village *</label>
                    <select
                      value={formData.village_id}
                      onChange={(e) => setFormData({ ...formData, village_id: e.target.value })}
                      required
                    >
                      <option value="">Select Village</option>
                      {Array.isArray(villages) && villages.map(village => (
                        <option key={village.id} value={village.id}>
                          {village.name} - {village.district}, {village.state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('projects.projectTitle')} *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('projects.type')}</label>
                    <select
                      value={formData.project_type}
                      onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    >
                      <option value="">Select Type</option>
                      {Object.keys(DEFAULT_CHECKPOINTS).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('funds.description')}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('projects.allocated')} (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.allocated_amount}
                        onChange={(e) => setFormData({ ...formData, allocated_amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3>Project Subtasks (Checkpoints)</h3>
                      <button type="button" className="btn-secondary" onClick={handleAddCheckpoint}>
                        <MdAdd /> Add Subtask
                      </button>
                    </div>
                    {checkpoints.map((checkpoint, index) => (
                      <div key={index} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong>Subtask {index + 1}</strong>
                          <button type="button" onClick={() => handleRemoveCheckpoint(index)}>
                            <MdClose />
                          </button>
                        </div>
                        <div className="form-group">
                          <label>Subtask Name *</label>
                          <input
                            type="text"
                            value={checkpoint.name}
                            onChange={(e) => handleCheckpointChange(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <textarea
                            value={checkpoint.description}
                            onChange={(e) => handleCheckpointChange(index, 'description', e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={checkpoint.is_mandatory}
                                onChange={(e) => handleCheckpointChange(index, 'is_mandatory', e.target.checked)}
                              />
                              {' '}Mandatory
                            </label>
                          </div>
                          <div className="form-group">
                            <label>Estimated Date</label>
                            <input
                              type="date"
                              value={checkpoint.estimated_date}
                              onChange={(e) => handleCheckpointChange(index, 'estimated_date', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Create Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {showDetails && (() => {
        const project = showDetails;
        return (
          <div className="modal-overlay" onClick={() => setShowDetails(null)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{project.title}</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {user?.role === 'officer' && (
                    <button
                      className="btn-secondary"
                      style={{ backgroundColor: '#dc2626', color: 'white', borderColor: '#dc2626', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete project "${project.title}"? This action cannot be undone.`)) {
                          try {
                            await api.delete(`/projects/${project.id}`);
                            setShowDetails(null);
                            fetchProjects();
                          } catch (error: any) {
                            alert(error.response?.data?.error || 'Failed to delete project');
                          }
                        }
                      }}
                    >
                      <MdClose /> Delete
                    </button>
                  )}
                  <button className="modal-close" onClick={() => setShowDetails(null)}>
                    <MdClose />
                  </button>
                </div>
              </div>
              {detailsLoading ? (
                <div className="projects-loading">Loading details...</div>
              ) : (
                <div className="project-details-view">
                  {/* Tabs */}
                  <div style={{ borderBottom: '1px solid #ddd', marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      style={{
                        border: 'none',
                        background: activeTab === 'overview' ? '#003366' : 'transparent',
                        color: activeTab === 'overview' ? '#fff' : '#003366',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer'
                      }}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('checkpoints')}
                      style={{
                        border: 'none',
                        background: (activeTab as string) === 'checkpoints' ? '#003366' : 'transparent',
                        color: (activeTab as string) === 'checkpoints' ? '#fff' : '#003366',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer'
                      }}
                    >
                      Checkpoints & Submissions
                    </button>
                  </div>

                  {/* Tab content */}
                  {activeTab === 'overview' && (
                    <div className="details-section">
                      <h3>Project Information</h3>
                      <div className="details-grid">
                        <div className="detail-item">
                          <strong>Village:</strong> {project.village_name}
                        </div>
                        <div className="detail-item">
                          <strong>Type:</strong> {project.project_type || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Status:</strong>
                          <span className={`status-badge ${getStatusColor(project.status || '')}`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="detail-item">
                          <strong>Allocated:</strong> ₹{((project.allocated_amount || 0) / 100000).toFixed(2)}L
                        </div>
                        <div className="detail-item">
                          <strong>Utilized:</strong> ₹{((project.utilized_amount || 0) / 100000).toFixed(2)}L
                        </div>
                      </div>

                      {/* Project Completion Analytics */}
                      {project.checkpoints && project.checkpoints.length > 0 && (
                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #ddd' }}>
                          <h3>Project Completion Analytics</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                            {/* Completion Percentage Pie Chart */}
                            <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}>
                              <h4 style={{ marginBottom: '1rem', color: '#003366' }}>Overall Completion</h4>
                              {(() => {
                                const completion = (project.completion_percentage || 0);
                                const remaining = 100 - completion;
                                const pieData = [
                                  { name: 'Completed', value: completion },
                                  { name: 'Remaining', value: remaining }
                                ];
                                const COLORS = ['#28a745', '#e0e0e0'];
                                return (
                                  <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                      <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                      >
                                        {pieData.map((_entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip />
                                      <Legend />
                                    </PieChart>
                                  </ResponsiveContainer>
                                );
                              })()}
                              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#003366' }}>
                                  {project.completion_percentage || 0}%
                                </div>
                                <div style={{ color: '#666', fontSize: '0.9em' }}>
                                  {project.completed_checkpoints || 0} of {project.total_checkpoints || 0} checkpoints completed
                                </div>
                              </div>
                            </div>

                            {/* Checkpoint Progress Bar Chart */}
                            <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}>
                              <h4 style={{ marginBottom: '1rem', color: '#003366' }}>Checkpoint Progress</h4>
                              {(() => {
                                if (!project) return null;
                                const checkpoints = project.checkpoints || [];
                                const checkpointData = checkpoints.map((cp: Checkpoint) => {
                                  const isCompleted = Number(cp.approved_count || 0) > 0;
                                  return {
                                    name: cp.name.length > 15 ? cp.name.substring(0, 15) + '...' : cp.name,
                                    completed: isCompleted ? 100 : 0,
                                    pending: isCompleted ? 0 : 100
                                  };
                                });
                                return (
                                  <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={checkpointData} layout="vertical">
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis type="number" domain={[0, 100]} />
                                      <YAxis dataKey="name" type="category" width={120} />
                                      <Tooltip />
                                      <Legend />
                                      <Bar dataKey="completed" stackId="a" fill="#28a745" name="Completed" />
                                      <Bar dataKey="pending" stackId="a" fill="#e0e0e0" name="Pending" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Checkpoint Status Summary */}
                          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {(project.checkpoints || []).map((checkpoint: Checkpoint) => {
                              const isCompleted = Number(checkpoint.approved_count || 0) > 0;
                              return (
                                <div
                                  key={checkpoint.id}
                                  style={{
                                    padding: '1rem',
                                    background: isCompleted ? '#f0fff0' : '#fff3cd',
                                    border: `2px solid ${isCompleted ? '#28a745' : '#ffc107'}`,
                                    borderRadius: '8px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {isCompleted ? (
                                      <MdCheckCircle style={{ color: '#28a745', fontSize: '1.2em' }} />
                                    ) : (
                                      <MdSchedule style={{ color: '#ffc107', fontSize: '1.2em' }} />
                                    )}
                                    <strong>{checkpoint.name}</strong>
                                  </div>
                                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                                    {isCompleted ? (
                                      <span style={{ color: '#28a745' }}>✓ Completed</span>
                                    ) : (
                                      <span style={{ color: '#ffc107' }}>⏳ Pending</span>
                                    )}
                                  </div>
                                  {checkpoint.is_mandatory && (
                                    <div style={{ fontSize: '0.8em', color: '#dc3545', marginTop: '0.25rem' }}>
                                      Mandatory
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}



                  {
                    (activeTab as string) === 'checkpoints' && project.checkpoints && project.checkpoints.length > 0 && (
                      <div className="details-section">
                        <h3>
                          Checkpoints & Submissions{' '}
                          {user?.role === 'officer' && (
                            <span style={{ fontSize: '0.8em', color: '#666' }}>(View Only)</span>
                          )}
                          {user?.role === 'employee' && (
                            <span style={{ fontSize: '0.8em', color: '#666' }}>(Review & Approve)</span>
                          )}
                        </h3>
                        <div className="checkpoints-list">
                          {(project.checkpoints || []).map((checkpoint: any) => {
                            const submissions = submissionsByCheckpoint[checkpoint.id] || [];
                            const hasSubmissions = submissions.length > 0;
                            return (
                              <div key={checkpoint.id} className="checkpoint-item" style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
                                <div className="checkpoint-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <div>
                                    <strong style={{ fontSize: '1.1em' }}>{checkpoint.name}</strong>
                                    {checkpoint.is_mandatory && <span className="badge mandatory" style={{ marginLeft: '0.5rem' }}>Mandatory</span>}
                                  </div>
                                  <div className="checkpoint-stats" style={{ display: 'flex', gap: '1rem' }}>
                                    <span style={{ color: '#008000' }}><MdCheckCircle /> {checkpoint.approved_count || 0} Approved</span>
                                    <span><MdSchedule /> {checkpoint.submission_count || 0} Total</span>
                                  </div>
                                </div>
                                {checkpoint.description && (
                                  <p className="checkpoint-description" style={{ marginBottom: '0.5rem', color: '#666' }}>{checkpoint.description}</p>
                                )}
                                {checkpoint.estimated_date && (
                                  <p className="checkpoint-date" style={{ marginBottom: '0.5rem', fontSize: '0.9em' }}>Estimated: {new Date(checkpoint.estimated_date).toLocaleDateString()}</p>
                                )}

                                {/* Both officers and employees can view submissions, but only employees can approve/reject */}
                                <button
                                  className="btn-link"
                                  onClick={() => loadSubmissions(checkpoint.id)}
                                  style={{
                                    marginTop: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {hasSubmissions ? `View ${submissions.length} Submission(s)` : 'Load Submissions'}
                                </button>
                                {user?.role === 'officer' && hasSubmissions && (
                                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fff9e6', borderRadius: '4px', fontSize: '0.85em', color: '#856404', borderLeft: '3px solid #ffc107' }}>
                                    ℹ️ <strong>View Only:</strong> You can view all submissions but cannot approve or reject them.
                                  </div>
                                )}

                                {submissions.length > 0 && (
                                  <div className="submissions-list" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem' }}>Submissions ({submissions.length}):</h4>
                                    {submissions.map((submission) => (
                                      <div key={submission.id} className="submission-card" style={{
                                        border: '1px solid #ddd',
                                        padding: '1rem',
                                        marginBottom: '0.5rem',
                                        borderRadius: '4px',
                                        backgroundColor: submission.status === 'approved' ? '#f0fff0' : submission.status === 'rejected' ? '#fff0f0' : '#fff'
                                      }}>
                                        <div className="submission-meta" style={{ marginBottom: '0.5rem' }}>
                                          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                            Status: <span style={{
                                              color: submission.status === 'approved' ? '#008000' : submission.status === 'rejected' ? '#ff0000' : '#ff8800',
                                              textTransform: 'uppercase'
                                            }}>{submission.status}</span>
                                          </div>
                                          <div style={{ fontSize: '0.9em', color: '#666' }}>
                                            Submitted by <strong>{submission.submitted_by}</strong> on{' '}
                                            {new Date(submission.submitted_at).toLocaleString()}
                                          </div>
                                          {submission.review_notes && (
                                            <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#666' }}>
                                              Review notes: {submission.review_notes}
                                            </div>
                                          )}
                                        </div>
                                        <div className="submission-media" style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#f9f9f9', borderRadius: '4px' }}>
                                          <strong>Media: </strong>
                                          {(() => {
                                            console.log(`Submission ${submission.id} media:`, submission.media);
                                            if (submission.media && submission.media.length > 0) {
                                              return (
                                                <>
                                                  <span>({submission.media.length} file(s))</span>
                                                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                    {submission.media.map((m) => (
                                                      <div key={m.id} className="media-item" style={{ border: '1px solid #ddd', padding: '0.5rem', borderRadius: '4px' }}>
                                                        {m.type === 'image' && (
                                                          <>
                                                            <img
                                                              src={m.url}
                                                              alt="Submission"
                                                              style={{ maxWidth: '200px', display: 'block', borderRadius: '4px' }}
                                                              onError={(e) => {
                                                                console.error('Image failed to load:', m.url);
                                                                e.currentTarget.style.border = '2px solid red';
                                                                e.currentTarget.alt = 'Failed to load';
                                                              }}
                                                            />
                                                            <div style={{ fontSize: '0.75em', color: '#666', marginTop: '0.25rem', wordBreak: 'break-all' }}>
                                                              {m.url}
                                                            </div>
                                                          </>
                                                        )}
                                                        {m.type === 'audio' && (
                                                          <>
                                                            <audio controls src={m.url} style={{ width: '100%' }} />
                                                            <div style={{ fontSize: '0.75em', color: '#666', marginTop: '0.25rem', wordBreak: 'break-all' }}>
                                                              {m.url}
                                                            </div>
                                                          </>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </>
                                              );
                                            } else {
                                              return <span style={{ color: '#999', fontStyle: 'italic' }}>No media files attached</span>;
                                            }
                                          })()}
                                        </div>
                                        {/* Only employees can review submissions */}
                                        {user?.role === 'employee' && submission.status === 'pending' && (
                                          <div className="submission-actions" style={{
                                            display: 'flex',
                                            gap: '0.5rem',
                                            marginTop: '0.5rem',
                                            paddingTop: '0.5rem',
                                            borderTop: '1px solid #eee'
                                          }}>
                                            <button
                                              className="btn-small"
                                              disabled={reviewLoadingId === submission.id}
                                              onClick={() => reviewSubmission(checkpoint.id, submission, 'approved')}
                                              style={{
                                                padding: '0.5rem 1rem',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: reviewLoadingId === submission.id ? 'not-allowed' : 'pointer',
                                                opacity: reviewLoadingId === submission.id ? 0.6 : 1
                                              }}
                                            >
                                              {reviewLoadingId === submission.id ? 'Processing...' : '✓ Approve'}
                                            </button>
                                            <button
                                              className="btn-small"
                                              disabled={reviewLoadingId === submission.id}
                                              onClick={() => reviewSubmission(checkpoint.id, submission, 'rejected')}
                                              style={{
                                                padding: '0.5rem 1rem',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: reviewLoadingId === submission.id ? 'not-allowed' : 'pointer',
                                                opacity: reviewLoadingId === submission.id ? 0.6 : 1
                                              }}
                                            >
                                              ✗ Reject
                                            </button>
                                            <button
                                              className="btn-small"
                                              disabled={reviewLoadingId === submission.id}
                                              onClick={() => reviewSubmission(checkpoint.id, submission, 'requires_revision')}
                                              style={{
                                                padding: '0.5rem 1rem',
                                                backgroundColor: '#ffc107',
                                                color: '#000',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: reviewLoadingId === submission.id ? 'not-allowed' : 'pointer',
                                                opacity: reviewLoadingId === submission.id ? 0.6 : 1
                                              }}
                                            >
                                              ↻ Needs Rework
                                            </button>
                                          </div>
                                        )}
                                        {user?.role === 'employee' && submission.status !== 'pending' && (
                                          <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#666' }}>
                                            Already reviewed
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {submissions.length === 0 && hasSubmissions === false && (
                                  <div style={{ marginTop: '0.5rem', color: '#666', fontStyle: 'italic' }}>
                                    No submissions yet for this checkpoint
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  }
                </div >
              )}
            </div >
          </div >
        );
      })()}



      {
        activeTab === 'overview' && !showDetails && (
          <>
            <div className="projects-grid">
              {projects.map(project => {
                const utilizationRate = project.allocated_amount > 0
                  ? ((project.utilized_amount / project.allocated_amount) * 100).toFixed(1)
                  : 0;

                return (
                  <div key={project.id} className="project-card">
                    <div className="project-header">
                      <h3>{project.title}</h3>
                      <span className={`status-badge ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="project-details">
                      <p><strong>Village:</strong> {project.village_name}</p>
                      <p><strong>Type:</strong> {project.project_type || 'N/A'}</p>
                      <div className="project-funds">
                        <div className="fund-info">
                          <span>Allocated: ₹{(project.allocated_amount / 100000).toFixed(2)}L</span>
                          <span>Utilized: ₹{(project.utilized_amount / 100000).toFixed(2)}L</span>
                        </div>
                        <div className="fund-progress">
                          <div
                            className="fund-progress-bar"
                            style={{ width: `${utilizationRate}%` }}
                          ></div>
                        </div>
                        <div className="fund-percentage">{utilizationRate}%</div>
                      </div>
                    </div>
                    <div className="project-actions">
                      <button className="btn-link" onClick={() => handleViewDetails(project)}>
                        <MdInfo /> View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {projects.length === 0 && !loading && (
              <div className="empty-state">
                <p>No projects found</p>
              </div>
            )}


          </>
        )
      }

    </div >
  );
};

export default Projects;