import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MdArrowBack, MdAdd, MdClose, MdEdit, MdFolderShared, MdWork, MdDashboard, MdReportProblem, MdConstruction } from 'react-icons/md';
import { DEFAULT_CHECKPOINTS } from '../constants/projectCheckpoints';
import VillageSkillStats from '../components/VillageSkillStats';
import './Manage.css';

interface Village {
  id: number;
  name: string;
  state: string;
  district: string;
  block?: string;
  population?: number;
  adarsh_score: number;
  fund_summary?: {
    total_allocated: number;
    total_utilized: number;
  };
  projects?: Project[];
  priority_votes?: any[];
}

interface Project {
  id: number;
  title: string;
  project_type: string;
  status: string;
  allocated_amount: number;
  utilized_amount: number;
  completion_percent: number;
  checkpoints?: Checkpoint[];
}

interface Checkpoint {
  id: number;
  name: string;
  description?: string;
  checkpoint_order: number;
  is_mandatory: boolean;
  estimated_date?: string;
}

const VillageDetailView: React.FC = () => {
  const { t } = useTranslation();
  const { villageId } = useParams<{ villageId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [village, setVillage] = useState<Village | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'projects', 'issues', 'skills'
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [projectFormData, setProjectFormData] = useState({
    title: '',
    description: '',
    project_type: '',
    allocated_amount: '',
    start_date: '',
    end_date: '',
    from_vote_id: null as number | null,
    status: '', // Added status field
  });

  const [checkpoints, setCheckpoints] = useState<Array<{ name: string; description: string; is_mandatory: boolean; completion_percentage?: number; estimated_date: string }>>([]);
  const [issues, setIssues] = useState<any[]>([]);

  const fetchIssues = async (id: number) => {
    try {
      const response = await api.get(`/issues/${id}/all`);
      setIssues(response.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const handleIssueAction = async (issueId: number, status: string) => {
    try {
      await api.post(`/issues/${issueId}/status`, { status });
      if (villageId) fetchIssues(parseInt(villageId));
    } catch (error) {
      console.error('Error updating issue status:', error);
      alert(t('common.error'));
    }
  };

  const handleConvertIssue = async (issue: any) => {
    if (!confirm(t('villages.convertConfirm'))) return;
    try {
      await api.post(`/issues/${issue.id}/convert`, {});
      if (villageId) {
        fetchIssues(parseInt(villageId));
        fetchVillageDetails();
      }
    } catch (error) {
      console.error('Error converting issue:', error);
      alert(t('common.error'));
    }
  };

  // Auto-calculate checkpoint dates when start/end date or type changes
  useEffect(() => {
    if (!projectFormData.project_type || !DEFAULT_CHECKPOINTS[projectFormData.project_type]) return;

    const defaults = DEFAULT_CHECKPOINTS[projectFormData.project_type];

    // If we have start and end dates, calculate based on percentage
    if (projectFormData.start_date && projectFormData.end_date) {
      const start = new Date(projectFormData.start_date);
      const end = new Date(projectFormData.end_date);
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
    const newCheckpoints = defaults.map(cp => {
      let estimatedDate = '';
      if (projectFormData.start_date) {
        const start = new Date(projectFormData.start_date);
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

  }, [projectFormData.start_date, projectFormData.end_date, projectFormData.project_type]);

  useEffect(() => {
    if (villageId) {
      // Validate villageId is a number
      const id = parseInt(villageId, 10);
      if (isNaN(id) || id <= 0) {
        setError('Invalid village ID');
        setLoading(false);
        return;
      }
      fetchVillageDetails();
      fetchIssues(id);
    } else {
      setError('Village ID is missing');
      setLoading(false);
    }
  }, [villageId]);

  const fetchVillageDetails = async () => {
    if (!villageId) {
      setError('Village ID is missing');
      setLoading(false);
      return;
    }

    // Validate villageId is a number
    const id = parseInt(villageId, 10);
    if (isNaN(id) || id <= 0) {
      setError('Invalid village ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Fetching village details for ID:', id);

      const response = await api.get(`/villages/${id}`);
      console.log('Village details response:', response.data);

      const v = response.data;

      // Handle both direct response and nested village object
      const villageData = v.village || v;

      // Ensure we have valid data
      if (!villageData || !villageData.id) {
        throw new Error('Invalid village data received from server');
      }

      // Parse fund_summary - handle both direct and nested
      let fundSummary = v.fund_summary || villageData.fund_summary;
      if (!fundSummary) {
        fundSummary = { total_allocated: 0, total_utilized: 0 };
      } else {
        fundSummary = {
          total_allocated: Number(fundSummary.total_allocated || 0),
          total_utilized: Number(fundSummary.total_utilized || 0),
        };
      }

      // Parse projects - ensure it's an array
      let projects = v.projects || villageData.projects || [];
      if (!Array.isArray(projects)) {
        projects = [];
      }

      setVillage({
        id: Number(villageData.id),
        name: villageData.name || '',
        state: villageData.state || '',
        district: villageData.district || '',
        block: villageData.block || undefined,
        population: villageData.population ? Number(villageData.population) : undefined,
        adarsh_score: Number(villageData.adarsh_score || 0),
        fund_summary: fundSummary,
        projects: projects,
        priority_votes: v.priority_votes || [],
      });

      console.log('Village state set successfully:', {
        id: villageData.id,
        name: villageData.name,
        projectsCount: projects.length,
        fundSummary,
      });
    } catch (error: any) {
      console.error('Error fetching village details:', error);
      let errorMessage = t('common.error');

      if (error.response) {
        if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else if (error.response.status === 404) {
          errorMessage = 'Village not found.';
        } else {
          errorMessage = error.response?.data?.error
            || error.response?.data?.message
            || `Server error (${error.response.status}). Please try again.`;
        }
      } else if (error.request) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message || t('common.error');
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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

  const handleConvertVote = (vote: any) => {
    setProjectFormData({
      ...projectFormData,
      title: vote.required_infrastructure,
      description: `${vote.description}\n\n(Based on priority vote ID: ${vote.id}, Votes: ${vote.total_votes})`,
      project_type: '', // User still needs to select type
      allocated_amount: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      from_vote_id: vote.id,
    });
    setShowAddProject(true);
    // Optionally scroll to top or focus modal
  };

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectFormData({
      title: project.title,
      description: '', // Description might not be in the list view, purely optional default
      project_type: project.project_type,
      allocated_amount: project.allocated_amount.toString(),
      start_date: '', // Dates might need formatting if available
      end_date: '',
      from_vote_id: null,
      status: project.status, // Pre-fill status
    });
    // ideally we need to fetch full project details effectively or pass them down. 
    // Since title/type/amount are main things, we prepopulate them.
    // For now let's assume listing has enough. Or we might want to fetch single project details?
    // Actually, listing has 'allocated_amount', 'title', 'project_type'.
    // Missing: 'description', 'start_date', 'end_date'. 
    // We should probably fetch the single project details to edit it properly.
    // But since we are creating a generic edit, let's just use what we have and maybe fetch inside the modal effect? 
    // For simplicity, let's fetch the full project details when edit is clicked.

    setIsEditMode(true);
    setEditingProjectId(project.id);
    fetchProjectDetailsForEdit(project.id);
  };

  const fetchProjectDetailsForEdit = async (id: number) => {
    try {
      const res = await api.get(`/projects/${id}`);
      const p = res.data;
      setProjectFormData({
        title: p.title,
        description: p.description || '',
        project_type: p.project_type,
        allocated_amount: p.allocated_amount,
        start_date: p.start_date ? p.start_date.split('T')[0] : '',
        end_date: p.end_date ? p.end_date.split('T')[0] : '',
        from_vote_id: null,
        status: p.status // Include status so it can be edited
      });
      setCheckpoints(p.checkpoints?.map((cp: any) => ({
        name: cp.name,
        description: cp.description,
        is_mandatory: cp.is_mandatory,
        estimated_date: cp.estimated_date ? cp.estimated_date.split('T')[0] : ''
      })) || []);
      setShowAddProject(true);
    } catch (e) {
      console.error(e);
      alert(t('common.error'));
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageId) return;

    setError('');
    setSuccessMessage('');

    let projectId = null;

    try {
      if (isEditMode && editingProjectId) {
        // Update existing project
        await api.put(`/projects/${editingProjectId}`, {
          title: projectFormData.title,
          description: projectFormData.description,
          project_type: projectFormData.project_type,
          allocated_amount: parseFloat(projectFormData.allocated_amount),
          start_date: projectFormData.start_date || null,
          end_date: projectFormData.end_date || null,
          status: projectFormData.status, // Send status update
          // We don't update from_vote_id usually on edit
        });
        projectId = editingProjectId;
        console.log('✅ Project updated successfully, ID:', projectId);
      } else {
        // Create new Project
        const projectResponse = await api.post('/projects', {
          village_id: parseInt(villageId),
          title: projectFormData.title,
          description: projectFormData.description,
          project_type: projectFormData.project_type,
          allocated_amount: parseFloat(projectFormData.allocated_amount),
          start_date: projectFormData.start_date || null,
          end_date: projectFormData.end_date || null,
          from_vote_id: projectFormData.from_vote_id,
        });
        projectId = projectResponse.data.id || projectResponse.data.project?.id;
        console.log('✅ Project created successfully, ID:', projectId);
      }

    } catch (error: any) {
      console.error('❌ Error saving project:', error);
      setError(error.response?.data?.error || t('common.error'));
      return; // Stop here if project creation/update failed
    }

    // If we get here, project was created successfully!
    // Now try checkpoints, but don't let failures stop us

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
            sequence_order: i + 1, // FIXED: was checkpoint_order, should be sequence_order
            is_mandatory: checkpoint.is_mandatory,
            estimated_date: checkpoint.estimated_date || null,
          });
          console.log(`✅ Checkpoint ${i + 1} created`);
        } catch (cpError: any) {
          failedCount++;
          console.warn(`⚠️ Checkpoint ${i + 1} failed:`, cpError.response?.data?.error || cpError.message);
        }
      }

      if (failedCount > 0) {
        checkpointWarning = ` (${failedCount}/${checkpoints.length} checkpoints failed)`;
      }
    }

    // ALWAYS close form and show success since project was created
    console.log('Closing form and showing success...');
    setShowAddProject(false);
    setIsEditMode(false);
    setEditingProjectId(null);
    setProjectFormData({
      title: '',
      description: '',
      project_type: '',
      allocated_amount: '',
      start_date: '',
      end_date: '',
      from_vote_id: null,
      status: '', // Reset status
    });
    setCheckpoints([]);

    // Show success message
    setSuccessMessage(t('common.success') + ' ' + checkpointWarning);

    // Refresh village details to show new project
    try {
      await fetchVillageDetails();
      console.log('✅ Village details refreshed');
    } catch (refreshError) {
      console.warn('⚠️ Failed to refresh village details:', refreshError);
    }

    // Clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  if (loading) {
    return (
      <div className="village-detail-view">
        <div className="manage-header">
          <button className="back-button" onClick={() => navigate('/manage')}>
            <MdArrowBack /> {t('common.view')}
          </button>
          <h1>{t('common.loading')}</h1>
        </div>
        <div className="manage-loading">{t('common.loading')}</div>
      </div>
    );
  }

  if (error && !village) {
    return (
      <div className="village-detail-view">
        <div className="manage-header">
          <button className="back-button" onClick={() => navigate('/manage')}>
            <MdArrowBack /> {t('common.view')}
          </button>
          <h1>{t('common.error')}</h1>
        </div>
        <div className="manage-error">
          <p>{error}</p>
          <button onClick={fetchVillageDetails}>{t('common.retry')}</button>
        </div>
      </div>
    );
  }

  if (!village) {
    return (
      <div className="village-detail-view">
        <div className="manage-header">
          <button className="back-button" onClick={() => navigate('/manage')}>
            <MdArrowBack /> {t('common.view')}
          </button>
          <h1>{t('common.error')}</h1>
        </div>
        <div className="manage-error">
          <p>{t('villages.notFound')}</p>
          <button onClick={() => navigate('/manage')}>{t('common.view')}</button>
        </div>
      </div>
    );
  }

  const fundSummary = village.fund_summary || { total_allocated: 0, total_utilized: 0 };
  const utilizationPercent = fundSummary.total_allocated > 0
    ? ((fundSummary.total_utilized / fundSummary.total_allocated) * 100).toFixed(1)
    : 0;

  return (
    <div className="village-detail-view">
      <div className="manage-header">
        <button className="back-button" onClick={() => navigate(`/manage/state/${encodeURIComponent(village.state)}`)}>
          <MdArrowBack /> {t('common.view')} {village.state}
        </button>
        <h1>{village.name}</h1>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem', padding: '1rem', background: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message" style={{ marginBottom: '1rem', padding: '1rem', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', border: '1px solid #4caf50' }}>
          ✓ {successMessage}
        </div>
      )}

      <div className="village-detail-header">
        <div className="village-info-grid">
          <div>
            <strong>{t('villages.state')}:</strong> {village.state}
          </div>
          <div>
            <strong>{t('villages.district')}:</strong> {village.district}
          </div>
          {village.block && (
            <div>
              <strong>{t('villages.block')}:</strong> {village.block}
            </div>
          )}
          {village.population && (
            <div>
              <strong>{t('villages.population')}:</strong> {village.population.toLocaleString()}
            </div>
          )}
          <div>
            <strong>{t('villages.adarshScore')}:</strong> {Number(village.adarsh_score || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="village-tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #ddd', margin: '2rem 0 1.5rem' }}>
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          style={{ padding: '0.8rem 1.5rem', border: 'none', background: 'none', borderBottom: activeTab === 'overview' ? '3px solid var(--gov-primary)' : 'none', fontWeight: activeTab === 'overview' ? 'bold' : 'normal', color: activeTab === 'overview' ? 'var(--gov-primary)' : '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <MdDashboard /> Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
          style={{ padding: '0.8rem 1.5rem', border: 'none', background: 'none', borderBottom: activeTab === 'projects' ? '3px solid var(--gov-primary)' : 'none', fontWeight: activeTab === 'projects' ? 'bold' : 'normal', color: activeTab === 'projects' ? 'var(--gov-primary)' : '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <MdConstruction /> Projects
        </button>
        <button
          className={`tab-button ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
          style={{ padding: '0.8rem 1.5rem', border: 'none', background: 'none', borderBottom: activeTab === 'issues' ? '3px solid var(--gov-primary)' : 'none', fontWeight: activeTab === 'issues' ? 'bold' : 'normal', color: activeTab === 'issues' ? 'var(--gov-primary)' : '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <MdReportProblem /> Issues
        </button>
        <button
          className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
          style={{ padding: '0.8rem 1.5rem', border: 'none', background: 'none', borderBottom: activeTab === 'skills' ? '3px solid var(--gov-primary)' : 'none', fontWeight: activeTab === 'skills' ? 'bold' : 'normal', color: activeTab === 'skills' ? 'var(--gov-primary)' : '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <MdWork /> Skill & Employment
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Project Summary Card */}
          <div className="fund-summary-card" style={{ marginTop: '1.5rem', background: '#f8f9fa', border: '2px solid var(--gov-primary)' }}>
            <h3 style={{ color: 'var(--gov-primary)' }}>{t('dashboard.overview')}</h3>
            <div className="fund-stats">
              <div className="fund-stat">
                <div className="fund-stat-label">{t('villages.ongoingProjects')}</div>
                <div className="fund-stat-value" style={{ color: 'var(--gov-primary)', fontSize: '2rem' }}>
                  {village.projects?.length || 0}
                </div>
              </div>
              <div className="fund-stat">
                <div className="fund-stat-label">{t('dashboard.totalFunds')}</div>
                <div className="fund-stat-value" style={{ color: 'var(--gov-success)' }}>
                  ₹{((village.projects?.reduce((sum, p) => sum + (Number(p.allocated_amount) || 0), 0) || 0) / 100000).toFixed(2)}L
                </div>
              </div>
              <div className="fund-stat">
                <div className="fund-stat-label">{t('dashboard.completed')}</div>
                <div className="fund-stat-value" style={{ color: 'var(--gov-accent)' }}>
                  {village.projects?.filter(p => p.status === 'completed').length || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="fund-summary-card">
            <h3>{t('villages.fundSummary')}</h3>
            <div className="fund-stats">
              <div className="fund-stat">
                <div className="fund-stat-label">{t('dashboard.allocated')}</div>
                <div className="fund-stat-value">₹{(fundSummary.total_allocated / 100000).toFixed(2)}L</div>
              </div>
              <div className="fund-stat">
                <div className="fund-stat-label">{t('dashboard.utilized')}</div>
                <div className="fund-stat-value">₹{(fundSummary.total_utilized / 100000).toFixed(2)}L</div>
              </div>
              <div className="fund-stat">
                <div className="fund-stat-label">{t('analytics.fundUtilization')} %</div>
                <div className="fund-stat-value">{utilizationPercent}%</div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'issues' && (
        <div className="issues-section">
          <h2>{t('villages.reportedIssues')}</h2>
          <div className="issues-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {issues.length > 0 ? (
              issues.map((issue) => (
                <div key={issue.id} className="issue-card" style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0 }}>{issue.issue_type}</h4>
                    <span className={`status-badge ${issue.status}`} style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', background: '#eee' }}>
                      {issue.status}
                    </span>
                  </div>
                  <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{issue.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#888' }}>
                    <span>{t('villages.votes')}: {issue.vote_count}</span>
                    <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>

                  {issue.validation_notes && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f9f9f9', borderRadius: '4px', fontSize: '0.85rem' }}>
                      <strong>{t('common.validator')}:</strong> {issue.validator_name}<br />
                      <em>"{issue.validation_notes}"</em>
                    </div>
                  )}

                  {user?.role === 'officer' && issue.status !== 'converted' && issue.status !== 'rejected' && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      {issue.status !== 'approved' && (
                        <button
                          onClick={() => handleIssueAction(issue.id, 'approved')}
                          style={{ flex: 1, padding: '0.25rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {t('common.approve')}
                        </button>
                      )}
                      <button
                        onClick={() => handleConvertIssue(issue)}
                        style={{ flex: 1, padding: '0.25rem', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        {t('common.convert')}
                      </button>
                      <button
                        onClick={() => handleIssueAction(issue.id, 'rejected')}
                        style={{ flex: 1, padding: '0.25rem', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        {t('common.reject')}
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>{t('villages.noIssues')}</p>
            )}
          </div>
        </div>
      )}


      {activeTab === 'projects' && (
        <>
          <div className="proposed-projects-section" style={{ marginTop: '0rem' }}>
            <h2>{t('villages.proposedProjects')}</h2>
            <div className="issues-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              {village.priority_votes && village.priority_votes.length > 0 ? (
                village.priority_votes
                  .sort((a: any, b: any) => (b.total_votes || 0) - (a.total_votes || 0)) // Sort by votes descending
                  .map((vote: any, index: number) => (
                    <div key={vote.id} className="issue-card" style={{
                      padding: '1rem',
                      border: index === 0 ? '2px solid #ffc107' : '1px solid #ddd', // Highlight top vote
                      borderRadius: '8px',
                      background: index === 0 ? '#fff9e6' : 'white',
                      position: 'relative'
                    }}>
                      {index === 0 && (
                        <div style={{
                          position: 'absolute', top: '-10px', right: '10px',
                          background: '#ffc107', color: '#000', padding: '2px 8px',
                          borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold'
                        }}>
                          {t('villages.topPriority')}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0 }}>{vote.required_infrastructure}</h4>
                        <span className={`status-badge ${vote.status || 'pending'}`} style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          background: vote.status === 'verified' ? '#e8f5e9' : '#fff3e0',
                          color: vote.status === 'verified' ? '#2e7d32' : '#ef6c00'
                        }}>
                          {vote.status === 'verified' ? t('common.verified') : t('common.pending')}
                        </span>
                      </div>
                      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{vote.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#888' }}>
                        <span style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1rem' }}>{t('villages.votes')}: {vote.total_votes}</span>
                        <span>{new Date(vote.submitted_at).toLocaleDateString()}</span>
                      </div>
                      {vote.verification_notes && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f9f9f9', borderRadius: '4px', fontSize: '0.85rem' }}>
                          <strong>{t('common.verificationNote')}:</strong><br />
                          <em>"{vote.verification_notes}"</em>
                        </div>
                      )}

                      {/* Convert Action for Officers */}
                      {user?.role === 'officer' && (
                        <button
                          onClick={() => handleConvertVote(vote)}
                          style={{
                            width: '100%',
                            marginTop: '1rem',
                            padding: '0.5rem',
                            background: 'var(--gov-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <MdAdd /> {t('projects.create')}
                        </button>
                      )}
                    </div>
                  ))
              ) : (
                <p>{t('villages.noProposedProjects')}</p>
              )}
            </div>
          </div>

          <div className="projects-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>{t('projects.title')}</h2>
              {user?.role === 'officer' && (
                <button className="add-project-button" onClick={() => setShowAddProject(true)}>
                  <MdAdd /> {t('projects.addProject')}
                </button>
              )}
            </div>

            {showAddProject && (
              <div className="modal-overlay" onClick={() => setShowAddProject(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>{isEditMode ? t('projects.editProject') : t('projects.addProject')}</h2>
                    <button className="modal-close" onClick={() => {
                      setShowAddProject(false);
                      setIsEditMode(false);
                      setEditingProjectId(null);
                    }}>
                      <MdClose />
                    </button>
                  </div>
                  <form onSubmit={handleAddProject} className="village-form">
                    <div className="form-group">
                      <label>{t('projects.projectTitle')} *</label>
                      <input
                        type="text"
                        value={projectFormData.title}
                        onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('projects.description')}</label>
                      <textarea
                        value={projectFormData.description}
                        onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>{t('projects.type')} *</label>
                        <select
                          value={projectFormData.project_type}
                          onChange={(e) => setProjectFormData({ ...projectFormData, project_type: e.target.value })}
                          required
                        >
                          <option value="">{t('common.selectType')}</option>
                          {Object.keys(DEFAULT_CHECKPOINTS).map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{t('projects.allocated')} (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={projectFormData.allocated_amount}
                          onChange={(e) => setProjectFormData({ ...projectFormData, allocated_amount: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {isEditMode && (
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Status</label>
                        <select
                          value={projectFormData.status || 'planned'}
                          onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })}
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="planned">Planned</option>
                          <option value="sanctioned">Sanctioned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="on_hold">On Hold</option>
                        </select>
                      </div>
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <label>{t('projects.startDate')}</label>
                        <input
                          type="date"
                          value={projectFormData.start_date}
                          onChange={(e) => setProjectFormData({ ...projectFormData, start_date: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t('projects.endDate')}</label>
                        <input
                          type="date"
                          value={projectFormData.end_date}
                          onChange={(e) => setProjectFormData({ ...projectFormData, end_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>{t('projects.subtasks')}</h3>
                        <button type="button" className="btn-secondary" onClick={handleAddCheckpoint}>
                          <MdAdd /> {t('projects.addSubtask')}
                        </button>
                      </div>
                      {checkpoints.map((checkpoint, index) => (
                        <div key={index} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong>{t('projects.subtaskName')} {index + 1}</strong>
                            <button type="button" onClick={() => handleRemoveCheckpoint(index)}>
                              <MdClose />
                            </button>
                          </div>
                          <div className="form-group">
                            <label>{t('projects.subtaskName')} *</label>
                            <input
                              type="text"
                              value={checkpoint.name}
                              onChange={(e) => handleCheckpointChange(index, 'name', e.target.value)}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>{t('projects.description')}</label>
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
                                {' '}{t('projects.mandatory')}
                              </label>
                            </div>
                            <div className="form-group">
                              <label>{t('projects.estimatedDate')}</label>
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
                      <button type="button" className="btn-secondary" onClick={() => setShowAddProject(false)}>
                        {t('common.cancel')}
                      </button>
                      <button type="submit" className="btn-primary">
                        {t('projects.create')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="projects-grid">
              {village.projects && village.projects.length > 0 ? (
                village.projects.map((project) => (
                  <div
                    key={project.id}
                    className="project-card"
                    onClick={() => navigate(`/manage/project/${project.id}`)}
                  >
                    <div className="project-card-header">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', width: '100%' }}>
                        <h4 style={{ margin: 0, flex: 1 }}>{project.title}</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className={`status-badge ${project.status}`}>{project.status}</span>
                          {user?.role === 'officer' && (
                            <button
                              onClick={(e) => handleEditClick(e, project)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#1976d2', padding: 0, display: 'flex', alignItems: 'center'
                              }}
                              title={t('common.edit')}
                            >
                              <MdEdit />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ marginTop: '0.25rem' }}>
                        {(() => {
                          const type = project.project_type || 'other';
                          let label = '🟧 Infra Linked';
                          let bg = '#fff3e0';
                          let color = '#ef6c00';

                          if (type === 'education') { label = '🟦 Education Linked'; bg = '#e3f2fd'; color = '#1565c0'; }
                          if (type === 'healthcare') { label = '🟩 Health Linked'; bg = '#e8f5e9'; color = '#2e7d32'; }

                          return (
                            <span style={{
                              background: bg, color: color,
                              padding: '2px 8px', borderRadius: '12px',
                              fontSize: '0.75rem', fontWeight: 'bold'
                            }}>
                              {label}
                            </span>
                          );
                        })()}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                        Completion: {project.completion_percent}%
                      </div>
                    </div>
                    <div className="completion-bar">
                      <div
                        className="completion-fill"
                        style={{ width: `${project.completion_percent}%` }}
                      />
                    </div>
                    {/* Checklist removed - view details in project page */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem', color: '#1976d2' }}>
                        view details &rsaquo;
                      </div>

                      {project.status === 'sanctioned' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/manage/workspace/${project.id}`);
                          }}
                          style={{
                            background: '#e3f2fd', border: '1px solid #2196f3', color: '#1565c0',
                            padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <MdFolderShared /> Workspace
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p>No projects found for this village.</p>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'skills' && (
        <VillageSkillStats villageId={villageId!} />
      )}

    </div>
  );
};

export default VillageDetailView;