import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MdAdd, MdClose, MdCheckCircle, MdSchedule, MdInfo } from 'react-icons/md';
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
}

interface Checkpoint {
  id: number;
  name: string;
  description?: string;
  checkpoint_order: number;
  is_mandatory: boolean;
  estimated_date?: string;
  submission_count?: number;
  approved_count?: number;
}

const Projects: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetails, setShowDetails] = useState<Project | null>(null);
  const [villages, setVillages] = useState<any[]>([]);
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

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'officer') {
      fetchVillages();
    }
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setError(error.response?.data?.error || 'Failed to fetch projects');
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

    if (!formData.village_id || !formData.title || !formData.allocated_amount) {
      setError('Village, Title, and Allocated Amount are required');
      return;
    }

    try {
      await api.post('/projects', {
        ...formData,
        allocated_amount: parseFloat(formData.allocated_amount),
      });
      setShowAddForm(false);
      setFormData({ village_id: '', title: '', description: '', project_type: '', allocated_amount: '', start_date: '', end_date: '' });
      fetchProjects();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create project');
    }
  };

  const handleViewDetails = async (project: Project) => {
    try {
      const response = await api.get(`/projects/${project.id}`);
      setShowDetails(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch project details');
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
        <h1>{t('projects.title')}</h1>
        {user?.role === 'officer' && (
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <MdAdd /> Add Project
          </button>
        )}
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

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
                  {villages.map(village => (
                    <option key={village.id} value={village.id}>
                      {village.name} - {village.district}, {village.state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Project Type</label>
                <select
                  value={formData.project_type}
                  onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                >
                  <option value="">Select Type</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="education">Education</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="livelihood">Livelihood</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Allocated Amount (₹) *</label>
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

      {showDetails && (
        <div className="modal-overlay" onClick={() => setShowDetails(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showDetails.title} - Details</h2>
              <button className="modal-close" onClick={() => setShowDetails(null)}>
                <MdClose />
              </button>
            </div>
            <div className="project-details-view">
              <div className="details-section">
                <h3>Project Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Village:</strong> {showDetails.village_name}
                  </div>
                  <div className="detail-item">
                    <strong>Type:</strong> {showDetails.project_type || 'N/A'}
                  </div>
                  <div className="detail-item">
                    <strong>Status:</strong>
                    <span className={`status-badge ${getStatusColor(showDetails.status)}`}>
                      {showDetails.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Allocated:</strong> ₹{(showDetails.allocated_amount / 100000).toFixed(2)}L
                  </div>
                  <div className="detail-item">
                    <strong>Utilized:</strong> ₹{(showDetails.utilized_amount / 100000).toFixed(2)}L
                  </div>
                </div>
              </div>
              {showDetails.checkpoints && showDetails.checkpoints.length > 0 && (
                <div className="details-section">
                  <h3>Checkpoints</h3>
                  <div className="checkpoints-list">
                    {showDetails.checkpoints.map((checkpoint) => (
                      <div key={checkpoint.id} className="checkpoint-item">
                        <div className="checkpoint-header">
                          <div>
                            <strong>{checkpoint.name}</strong>
                            {checkpoint.is_mandatory && <span className="badge mandatory">Mandatory</span>}
                          </div>
                          <div className="checkpoint-stats">
                            <span><MdCheckCircle /> {checkpoint.approved_count || 0} Approved</span>
                            <span><MdSchedule /> {checkpoint.submission_count || 0} Total</span>
                          </div>
                        </div>
                        {checkpoint.description && (
                          <p className="checkpoint-description">{checkpoint.description}</p>
                        )}
                        {checkpoint.estimated_date && (
                          <p className="checkpoint-date">Estimated: {new Date(checkpoint.estimated_date).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default Projects;
