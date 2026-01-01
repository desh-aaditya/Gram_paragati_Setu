import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import VillageMap from '../components/VillageMap';
import { MdAdd, MdLocationOn, MdPeople, MdEdit, MdClose, MdDelete, MdChecklist, MdVisibility, MdAccountBalance } from 'react-icons/md';
import { locationData } from '../data/locations';
import './Villages.css';

interface Village {
  id: number;
  name: string;
  state: string;
  district: string;
  block?: string;
  population: number;
  adarsh_score: number;
  adarsh_gap?: number;
  is_adarsh_candidate: boolean;
  latitude: number;
  longitude: number;
  geometry: any;
  baseline_metrics?: any;
  score_breakdown?: any;
  fund_summary?: {
    total_allocated: number;
    total_utilized: number;
  };
  projects?: {
    id: number;
    title: string;
    project_type: string;
    status: string;
    allocated_amount: number;
    utilized_amount: number;
    completion_percent: number;
  }[];
  recent_submissions?: any[];
  pending_work?: {
    category: string;
    current_score: number;
    target: number;
    gap: number;
    action: string;
  }[];
  citizen_reviews?: {
    id: number;
    client_id: string;
    submitted_by: string;
    submitted_at: string;
    status: string;
    review_notes?: string;
    checkpoint_name: string;
    project_title: string;
  }[];
  priority_votes?: {
    id: number;
    required_infrastructure: string;
    description: string;
    category: string;
    total_votes: number;
    is_volunteer: boolean;
    volunteer_id?: string;
    employee_id?: number;
    submitted_at: string;
  }[];
}

const Villages: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({ state: '', district: '', adarsh_candidate: '' });
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    district: '',
    block: '',
    population: '',
    latitude: '',
    longitude: '',
  });
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    state: '',
    district: '',
    block: '',
    population: '',
    latitude: '',
    longitude: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Project checkpoints timeline state (shared for officer + employee views)
  interface TimelineCheckpoint {
    id: number;
    name: string;
    description?: string;
    checkpoint_order: number;
  }

  interface TimelineSubmission {
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

  const [timelineProjectId, setTimelineProjectId] = useState<number | null>(null);
  const [timelineProjectTitle, setTimelineProjectTitle] = useState<string>('');
  const [timelineCheckpoints, setTimelineCheckpoints] = useState<TimelineCheckpoint[]>([]);
  const [timelineSubmissionsByCheckpoint, setTimelineSubmissionsByCheckpoint] = useState<Record<number, TimelineSubmission[]>>({});
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState('');
  const [timelineReviewLoadingId, setTimelineReviewLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchVillages();
  }, [filters]);

  const fetchVillages = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filters.state) params.append('state', filters.state);
      if (filters.district) params.append('district', filters.district);
      if (filters.adarsh_candidate) params.append('adarsh_candidate', filters.adarsh_candidate);

      const response = await api.get(`/villages?${params.toString()}`);

      // Handle both array and object response formats
      const villagesData = Array.isArray(response.data)
        ? response.data
        : (response.data?.villages || response.data?.data || []);

      // Normalize data to avoid runtime errors from null/undefined fields
      const safeVillages: Village[] = villagesData.map((v: any) => ({
        id: v.id,
        name: v.name || '',
        state: v.state || '',
        district: v.district || '',
        block: v.block || '',
        population: Number(v.population || 0),
        adarsh_score: Number(v.adarsh_score || 0),
        is_adarsh_candidate: Boolean(v.is_adarsh_candidate),
        latitude: Number(v.latitude || 0),
        longitude: Number(v.longitude || 0),
        geometry: v.geometry || null,
        baseline_metrics: v.baseline_metrics || null,
        score_breakdown: v.score_breakdown || null,
      }));

      setVillages(safeVillages);
    } catch (error: any) {
      console.error('Error fetching villages:', error);
      const errorMessage = error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to fetch villages. Please try again later.';
      setError(errorMessage);
      setVillages([]); // Clear villages on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinates = async () => {
    if (!formData.name || !formData.state || !formData.district) {
      setError('Please enter village name, state, and district first');
      return;
    }

    try {
      setGeocodingLoading(true);
      setError('');

      // Build search query: "Village, District, State, India"
      const query = `${formData.name}, ${formData.district}, ${formData.state}, India`;

      // Use Nominatim OpenStreetMap geocoding API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `limit=1&` +
        `countrycodes=in` // Restrict to India
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        setFormData({
          ...formData,
          latitude: location.lat,
          longitude: location.lon,
        });
        setError(''); // Clear any previous errors
      } else {
        setError(`Could not find coordinates for "${formData.name}, ${formData.district}, ${formData.state}". Please enter manually or check spelling.`);
      }
    } catch (error: any) {
      console.error('Geocoding error:', error);
      setError('Failed to fetch coordinates. Please enter manually.');
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleAddVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.state || !formData.district) {
      setError('Name, State, and District are required');
      return;
    }

    try {
      const response = await api.post('/villages', {
        ...formData,
        population: formData.population ? parseInt(formData.population) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      });
      setShowAddForm(false);
      setFormData({ name: '', state: '', district: '', block: '', population: '', latitude: '', longitude: '' });

      // Use backend response so new village appears immediately on map
      const v = response.data.village;
      if (v) {
        const safeVillage: Village = {
          id: v.id,
          name: v.name || '',
          state: v.state || '',
          district: v.district || '',
          block: v.block || '',
          population: Number(v.population || 0),
          adarsh_score: Number(v.adarsh_score || 0),
          is_adarsh_candidate: Boolean(v.is_adarsh_candidate),
          latitude: Number(v.latitude || 0),
          longitude: Number(v.longitude || 0),
          geometry: v.geometry || null,
          baseline_metrics: v.baseline_metrics || null,
          score_breakdown: v.score_breakdown || null,
          fund_summary: v.fund_summary,
          projects: v.projects,
          recent_submissions: v.recent_submissions,
        };

        setVillages((prev) => [...prev, safeVillage]);
      } else {
        // Fallback: refetch list
        fetchVillages();
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create village');
    }
  };

  const openEditVillage = (village: Village) => {
    setEditFormData({
      name: village.name || '',
      state: village.state || '',
      district: village.district || '',
      block: village.block || '',
      population: village.population ? String(village.population) : '',
      latitude: village.latitude ? String(village.latitude) : '',
      longitude: village.longitude ? String(village.longitude) : '',
    });
    setIsEditing(true);
  };

  const handleEditVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVillage) return;
    setError('');

    if (!editFormData.name || !editFormData.state || !editFormData.district) {
      setError('Name, State, and District are required');
      return;
    }

    try {
      const payload: any = {
        name: editFormData.name,
        state: editFormData.state,
        district: editFormData.district,
        block: editFormData.block || null,
        population: editFormData.population ? parseInt(editFormData.population) : null,
        latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : null,
        longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : null,
      };

      const response = await api.put(`/villages/${selectedVillage.id}`, payload);
      const updated = response.data.village || response.data;

      // Update local list
      setVillages(prev =>
        prev.map(v =>
          v.id === selectedVillage.id
            ? {
              ...v,
              name: updated.name || v.name,
              state: updated.state || v.state,
              district: updated.district || v.district,
              block: updated.block ?? v.block,
              population: Number(updated.population ?? v.population ?? 0),
              latitude: Number(updated.latitude ?? v.latitude ?? 0),
              longitude: Number(updated.longitude ?? v.longitude ?? 0),
            }
            : v
        )
      );

      // Update selected village as well
      setSelectedVillage(prev =>
        prev
          ? {
            ...prev,
            name: updated.name || prev.name,
            state: updated.state || prev.state,
            district: updated.district || prev.district,
            block: updated.block ?? prev.block,
            population: Number(updated.population ?? prev.population ?? 0),
            latitude: Number(updated.latitude ?? prev.latitude ?? 0),
            longitude: Number(updated.longitude ?? prev.longitude ?? 0),
          }
          : prev
      );

      setIsEditing(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update village');
    }
  };

  const handleDeleteVillage = async () => {
    if (!selectedVillage) return;

    if (deleteConfirmName.trim() !== selectedVillage.name.trim()) {
      setError('Please type the village name exactly to confirm deletion.');
      return;
    }

    try {
      await api.delete(`/villages/${selectedVillage.id}`);
      setVillages(prev => prev.filter(v => v.id !== selectedVillage.id));
      setSelectedVillage(null);
      setShowDetails(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmName('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete village');
    }
  };

  const handleViewDetails = async (village: Village) => {
    try {
      setError('');
      setDetailsLoading(true);

      const response = await api.get(`/villages/${village.id}`);
      const v = response.data;

      // Handle both direct village object and nested village object
      const villageData = v.village || v;

      const safeVillage: Village = {
        id: villageData.id || village.id,
        name: villageData.name || village.name || '',
        state: villageData.state || village.state || '',
        district: villageData.district || village.district || '',
        block: villageData.block || village.block || '',
        population: Number(villageData.population || village.population || 0),
        adarsh_score: Number(villageData.adarsh_score || village.adarsh_score || 0),
        is_adarsh_candidate: Boolean(villageData.is_adarsh_candidate || village.is_adarsh_candidate),
        latitude: Number(villageData.latitude || village.latitude || 0),
        longitude: Number(villageData.longitude || village.longitude || 0),
        geometry: villageData.geometry || village.geometry || null,
        baseline_metrics: villageData.baseline_metrics || village.baseline_metrics || null,
        score_breakdown: villageData.score_breakdown || village.score_breakdown || null,
        fund_summary: villageData.fund_summary || village.fund_summary,
        projects: villageData.projects || village.projects || [],
        recent_submissions: villageData.recent_submissions || village.recent_submissions || [],
        pending_work: villageData.pending_work || village.pending_work || [],
        citizen_reviews: villageData.citizen_reviews || village.citizen_reviews || [],
        priority_votes: villageData.priority_votes || village.priority_votes || [],
        adarsh_gap: Number(villageData.adarsh_gap || village.adarsh_gap || 0),
      };

      setSelectedVillage(safeVillage);
      setShowDetails(true);
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmName('');
    } catch (error: any) {
      console.error('Error fetching village details:', error);
      const errorMessage = error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to fetch village details. Please try again later.';
      setError(errorMessage);

      // Still show the modal with available data if we have it
      if (village) {
        setSelectedVillage({
          ...village,
          projects: village.projects || [],
          recent_submissions: village.recent_submissions || [],
          pending_work: village.pending_work || [],
          citizen_reviews: village.citizen_reviews || [],
          priority_votes: village.priority_votes || [],
        });
        setShowDetails(true);
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  // --- Project checkpoints timeline helpers (shared Officer/Employee UX) ---
  const openProjectTimeline = async (projectId: number, title: string) => {
    try {
      setTimelineError('');
      setTimelineLoading(true);
      setTimelineProjectId(projectId);
      setTimelineProjectTitle(title);
      setTimelineSubmissionsByCheckpoint({});

      const projectResponse = await api.get(`/projects/${projectId}`);
      const checkpoints: TimelineCheckpoint[] = projectResponse.data.checkpoints || [];
      setTimelineCheckpoints(checkpoints);

      // Preload submissions for each checkpoint for a smooth timeline view
      const submissionsMap: Record<number, TimelineSubmission[]> = {};
      for (const cp of checkpoints) {
        try {
          const submissionsResponse = await api.get(`/checkpoints/${cp.id}/submissions`);
          submissionsMap[cp.id] = submissionsResponse.data || [];
        } catch (err) {
          // If one checkpoint fails, keep others
        }
      }
      setTimelineSubmissionsByCheckpoint(submissionsMap);
    } catch (error: any) {
      console.error('Error loading checkpoints timeline:', error);
      setTimelineError(error.response?.data?.error || 'Failed to load checkpoints timeline');
    } finally {
      setTimelineLoading(false);
    }
  };

  const reviewTimelineSubmission = async (
    checkpointId: number,
    submission: TimelineSubmission,
    status: 'approved' | 'rejected' | 'requires_revision'
  ) => {
    const review_notes = window.prompt('Optional comment for this review:', '') || undefined;
    setTimelineReviewLoadingId(submission.id);
    try {
      await api.post(`/checkpoints/${checkpointId}/submissions/${submission.id}/review`, {
        status,
        review_notes,
      });

      // Refresh submissions for this checkpoint
      const response = await api.get(`/checkpoints/${checkpointId}/submissions`);
      setTimelineSubmissionsByCheckpoint(prev => ({
        ...prev,
        [checkpointId]: response.data || [],
      }));

      // Also refresh selected village details so analytics stay in sync
      if (selectedVillage) {
        await handleViewDetails(selectedVillage);
      }
    } catch (error: any) {
      console.error('Error reviewing submission:', error);
      setError(error.response?.data?.error || 'Failed to review submission');
    } finally {
      setTimelineReviewLoadingId(null);
    }
  };

  if (loading && villages.length === 0) {
    return <div className="villages-loading">{t('common.loading')}</div>;
  }

  const states = Array.from(new Set(villages.map(v => v.state))).sort();
  const districts = Array.from(new Set(villages.map(v => v.district))).sort();

  return (
    <div className="villages-page">
      <div className="villages-header">
        <h1>{t('villages.title')}</h1>
        {user?.role === 'officer' && (
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <MdAdd /> {t('villages.addVillage')}
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
              <h2>{t('villages.addVillage')}</h2>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleAddVillage} className="village-form">
              <div className="form-group">
                <label>{t('villages.name')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('villages.state')} *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        state: e.target.value,
                        district: '' // Reset district when state changes
                      });
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">{t('common.selectType') || 'Select State'}</option>
                    {Object.keys(locationData).map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('villages.district')} *</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    required
                    disabled={!formData.state}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      backgroundColor: formData.state ? 'white' : '#f5f5f5',
                      cursor: formData.state ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">{t('common.selectType') || 'Select District'}</option>
                    {formData.state && locationData[formData.state]?.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('villages.block')}</label>
                  <input
                    type="text"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('villages.population')}</label>
                  <input
                    type="number"
                    value={formData.population}
                    onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={fetchCoordinates}
                  disabled={geocodingLoading || !formData.name || !formData.state || !formData.district}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <MdLocationOn />
                  {geocodingLoading ? 'Fetching Coordinates...' : 'Auto-Fill Coordinates'}
                </button>
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#666', textAlign: 'center' }}>
                  {formData.name && formData.state && formData.district
                    ? 'Click to automatically fetch coordinates'
                    : 'Enter village name, state, and district first'}
                </small>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Village
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails && selectedVillage && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedVillage.name} - Details</h2>
              <button className="modal-close" onClick={() => setShowDetails(false)}>
                <MdClose />
              </button>
            </div>
            {detailsLoading && (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="villages-loading">Loading village details...</div>
              </div>
            )}
            {error && (
              <div className="error-message" role="alert" style={{ margin: '1rem' }}>
                {error}
              </div>
            )}
            <div className="village-details">
              <div className="village-actions-header">
                {user?.role === 'officer' && (
                  <div className="action-buttons">
                    <button
                      className="btn-primary"
                      onClick={() => {
                        openEditVillage(selectedVillage);
                        setShowDetails(false);
                      }}
                    >
                      <MdEdit /> Update Village
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ backgroundColor: '#dc2626', color: 'white', borderColor: '#dc2626' }}
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowDetails(false);
                      }}
                    >
                      <MdDelete /> Delete Village
                    </button>
                  </div>
                )}
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <strong>{t('villages.state')}:</strong> {selectedVillage.state}
                </div>
                <div className="detail-item">
                  <strong>{t('villages.district')}:</strong> {selectedVillage.district}
                </div>
                {selectedVillage.block && (
                  <div className="detail-item">
                    <strong>{t('villages.block')}:</strong> {selectedVillage.block}
                  </div>
                )}
                {selectedVillage.population && (
                  <div className="detail-item">
                    <strong>{t('villages.population')}:</strong> {selectedVillage.population.toLocaleString()}
                  </div>
                )}
                <div className="detail-item">
                  <strong>{t('villages.adarshScore')}:</strong>
                  {selectedVillage.adarsh_score > 0 ? (
                    <span className={`score-badge ${selectedVillage.adarsh_score >= 85 ? 'adarsh' : selectedVillage.adarsh_score >= 70 ? 'good' : selectedVillage.adarsh_score >= 50 ? 'average' : 'low'}`}>
                      {selectedVillage.adarsh_score.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="score-badge low">Not Calculated</span>
                  )}
                </div>
                {selectedVillage.is_adarsh_candidate && (
                  <div className="detail-item">
                    <span className="badge adarsh-badge">{t('map.adarshCandidate')}</span>
                  </div>
                )}
              </div>

              {/* Adarsh Score Card */}
              <div style={{ background: '#f0f7ff', padding: '1.5rem', borderRadius: '8px', marginTop: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ color: '#003366', marginBottom: '1rem' }}>{t('villages.adarshAnalysis')}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: selectedVillage.adarsh_score >= 85 ? '#28a745' : '#ffc107' }}>
                    {selectedVillage.adarsh_score.toFixed(1)}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{t('villages.currentScore')}</div>
                    {selectedVillage.adarsh_gap !== undefined && selectedVillage.adarsh_gap > 0 && (
                      <div style={{ color: '#dc3545', marginTop: '0.5rem' }}>
                        Need {selectedVillage.adarsh_gap.toFixed(1)} more points to reach Adarsh (85)
                      </div>
                    )}
                    {selectedVillage.adarsh_score >= 85 && (
                      <div style={{ color: '#28a745', marginTop: '0.5rem', fontWeight: 'bold' }}>
                        ✓ Adarsh Village Achieved!
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Breakdown */}
                {selectedVillage.score_breakdown && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>Score Components:</h4>
                    <div className="breakdown-grid">
                      {Object.entries(selectedVillage.score_breakdown).map(([key, value]: [string, any]) => (
                        <div key={key} className="breakdown-item" style={{ background: 'white' }}>
                          <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>{' '}
                          <span style={{ color: Number(value || 0) >= 70 ? '#28a745' : '#ffc107' }}>
                            {Number(value || 0).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Work - What Village Lacks */}
                {selectedVillage.pending_work && selectedVillage.pending_work.length > 0 && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #ddd' }}>
                    <h4 style={{ color: '#dc3545', marginBottom: '1rem' }}>⚠️ What This Village Needs to Reach Adarsh:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedVillage.pending_work.map((work: any, idx: number) => (
                        <div key={idx} style={{
                          padding: '1rem',
                          background: '#fff3cd',
                          borderLeft: '4px solid #ffc107',
                          borderRadius: '4px'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            {work.category} (Current: {work.current_score.toFixed(1)}%, Target: {work.target}%)
                          </div>
                          <div style={{ color: '#666', fontSize: '0.9em' }}>
                            Gap: {work.gap.toFixed(1)}% — {work.action}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fund summary */}
              {selectedVillage.fund_summary && (
                <div className="village-funds">
                  <h3>{t('villages.fundSummary')}</h3>
                  <p>
                    <strong>Total Allocated:</strong>{' '}
                    ₹{(Number(selectedVillage.fund_summary.total_allocated || 0) / 100000).toFixed(2)}L
                  </p>
                  <p>
                    <strong>Total Utilized:</strong>{' '}
                    ₹{(Number(selectedVillage.fund_summary.total_utilized || 0) / 100000).toFixed(2)}L
                  </p>
                </div>
              )}

              {/* Ongoing Progress - Projects (card grid with actions) */}
              {selectedVillage.projects && selectedVillage.projects.length > 0 && (
                <div className="village-projects" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd' }}>
                  <h3>{t('villages.ongoingProjects')}</h3>
                  <div className="projects-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {selectedVillage.projects
                      .slice()
                      .sort((a, b) => {
                        // Sort by status then by completion percentage descending as a proxy for priority
                        if (a.status === b.status) {
                          return (b.completion_percent || 0) - (a.completion_percent || 0);
                        }
                        const order: Record<string, number> = {
                          in_progress: 1,
                          planned: 2,
                          completed: 3,
                          on_hold: 4,
                        };
                        return (order[a.status] || 99) - (order[b.status] || 99);
                      })
                      .map((p) => {
                        const utilizationRate = p.allocated_amount > 0
                          ? ((p.utilized_amount / p.allocated_amount) * 100).toFixed(1)
                          : 0;
                        return (
                          <div
                            key={p.id}
                            className="project-item"
                            style={{
                              padding: '1rem 1.25rem',
                              background: '#f8fbff',
                              borderRadius: '12px',
                              border: '1px solid #d0e3ff',
                              boxShadow: '0 2px 8px rgba(0, 51, 102, 0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.75rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.75rem' }}>
                              <div>
                                <strong style={{ fontSize: '1.05rem', color: '#003366' }}>{p.title}</strong>
                                <div style={{ fontSize: '0.9rem', color: '#556', marginTop: '0.25rem' }}>
                                  Type: {p.project_type || 'N/A'} | Status:{' '}
                                  <span className={`status-badge ${p.status}`}>{p.status}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f766e' }}>
                                  {p.completion_percent}%
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Complete</div>
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                                <span>Fund Utilization: {utilizationRate}%</span>
                                <span>₹{(p.allocated_amount / 100000).toFixed(2)}L allocated</span>
                              </div>
                              <div
                                style={{
                                  width: '100%',
                                  height: '8px',
                                  background: '#e2e8f0',
                                  borderRadius: '999px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${p.completion_percent}%`,
                                    height: '100%',
                                    background:
                                      p.completion_percent >= 80
                                        ? '#22c55e'
                                        : p.completion_percent >= 50
                                          ? '#facc15'
                                          : '#f97316',
                                    transition: 'width 0.3s',
                                  }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => openProjectTimeline(p.id, p.title)}
                              >
                                <MdChecklist /> Checkpoints
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => window.open(`/projects`, '_blank')}
                              >
                                <MdVisibility /> View Details
                              </button>
                              {user?.role === 'officer' && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => window.open('/funds', '_blank')}
                                >
                                  <MdAccountBalance /> Funds
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Village Priority Requests */}
              {selectedVillage.priority_votes && selectedVillage.priority_votes.length > 0 && (
                <div className="village-priority" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd' }}>
                  <h3>🏗️ Village Priority Requests</h3>
                  <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '1rem' }}>
                    Infrastructure requests submitted by villagers and volunteers, sorted by priority (highest votes)
                  </p>
                  <div className="priority-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {selectedVillage.priority_votes.map((priority: any) => (
                      <div key={priority.id} style={{
                        padding: '1rem',
                        background: priority.is_volunteer ? '#e7f3ff' : '#fff9e6',
                        borderLeft: `4px solid ${priority.is_volunteer ? '#007bff' : '#ffc107'}`,
                        borderRadius: '4px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <div>
                            <strong style={{ fontSize: '1.1em' }}>{priority.required_infrastructure}</strong>
                            {priority.category && (
                              <span style={{
                                marginLeft: '0.5rem',
                                padding: '0.25rem 0.5rem',
                                background: '#f0f0f0',
                                borderRadius: '4px',
                                fontSize: '0.85em'
                              }}>
                                {priority.category}
                              </span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#003366' }}>
                              {priority.total_votes}
                            </div>
                            <div style={{ fontSize: '0.8em', color: '#666' }}>votes</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '0.5rem' }}>
                          {priority.description}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85em', color: '#666' }}>
                          {priority.is_volunteer ? (
                            <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                              ✓ Verified by Volunteer
                            </span>
                          ) : (
                            <span style={{ color: '#ffc107' }}>
                              📝 Submitted by Villager
                            </span>
                          )}
                          <span>
                            Submitted: {new Date(priority.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Citizen Reviews from Mobile App */}
              {selectedVillage.citizen_reviews && selectedVillage.citizen_reviews.length > 0 && (
                <div className="citizen-reviews" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd' }}>
                  <h3>📱 Citizen Reviews (Mobile App)</h3>
                  <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '1rem' }}>
                    Reviews submitted by citizens through the mobile application
                  </p>
                  <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {selectedVillage.citizen_reviews.map((review: any) => (
                      <div key={review.id} style={{
                        padding: '1rem',
                        background: review.status === 'approved' ? '#f0fff0' : review.status === 'rejected' ? '#fff0f0' : '#fff',
                        border: `1px solid ${review.status === 'approved' ? '#28a745' : review.status === 'rejected' ? '#dc3545' : '#ddd'}`,
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <div>
                            <strong>{review.project_title}</strong>
                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '0.25rem' }}>
                              Checkpoint: {review.checkpoint_name}
                            </div>
                          </div>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            fontSize: '0.85em',
                            fontWeight: 'bold',
                            background: review.status === 'approved' ? '#28a745' : review.status === 'rejected' ? '#dc3545' : '#ffc107',
                            color: 'white'
                          }}>
                            {review.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5rem' }}>
                          <div>Submitted by: <strong>{review.submitted_by}</strong></div>
                          <div>Date: {new Date(review.submitted_at).toLocaleString()}</div>
                          {review.review_notes && (
                            <div style={{ marginTop: '0.5rem', fontStyle: 'italic', padding: '0.5rem', background: '#f9f9f9', borderRadius: '4px' }}>
                              Note: {review.review_notes}
                            </div>
                          )}
                          {review.client_id && (
                            <div style={{ fontSize: '0.8em', color: '#999', marginTop: '0.25rem' }}>
                              Mobile App ID: {review.client_id.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent submissions (non-citizen) */}
              {selectedVillage.recent_submissions && selectedVillage.recent_submissions.length > 0 && (
                <div className="village-submissions" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd' }}>
                  <h3>Recent Submissions</h3>
                  <div className="submissions-list">
                    {selectedVillage.recent_submissions.map((s: any) => (
                      <div key={s.id} className="submission-item">
                        <div>
                          <strong>{s.project_title}</strong> — {s.checkpoint_name}
                        </div>
                        <div>Status: {s.status}</div>
                        <div>
                          Submitted by: {s.submitted_by}{' '}
                          on {new Date(s.submitted_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Village Modal */}
      {isEditing && selectedVillage && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Village - {selectedVillage.name}</h2>
              <button className="modal-close" onClick={() => setIsEditing(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleEditVillage} className="village-form">
              <div className="form-group">
                <label>Village Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('villages.state')} *</label>
                  <select
                    value={editFormData.state}
                    onChange={(e) => {
                      setEditFormData({
                        ...editFormData,
                        state: e.target.value,
                        district: '' // Reset district on state change
                      });
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select State</option>
                    {Object.keys(locationData).map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('villages.district')} *</label>
                  <select
                    value={editFormData.district}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                    required
                    disabled={!editFormData.state}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      backgroundColor: editFormData.state ? 'white' : '#f5f5f5',
                      cursor: editFormData.state ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">Select District</option>
                    {editFormData.state && locationData[editFormData.state]?.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Block/Taluka</label>
                  <input
                    type="text"
                    value={editFormData.block}
                    onChange={(e) => setEditFormData({ ...editFormData, block: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Population</label>
                  <input
                    type="number"
                    value={editFormData.population}
                    onChange={(e) => setEditFormData({ ...editFormData, population: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editFormData.latitude}
                    onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editFormData.longitude}
                    onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Village confirmation */}
      {showDeleteConfirm && selectedVillage && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Village - {selectedVillage.name}</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <MdClose />
              </button>
            </div>
            <div className="village-form">
              <p>
                This will <strong>soft-delete</strong> the village from officer and employee views while keeping related
                projects and checkpoints for reporting. To confirm, type the village name below.
              </p>
              <div className="form-group">
                <label>Type "{selectedVillage.name}" to confirm</label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" style={{ backgroundColor: '#dc2626' }} onClick={handleDeleteVillage}>
                  <MdDelete /> Delete Village
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project checkpoints timeline modal (shared Officer/Employee) */}
      {timelineProjectId && (
        <div className="modal-overlay" onClick={() => setTimelineProjectId(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Checkpoints - {timelineProjectTitle}</h2>
              <button className="modal-close" onClick={() => setTimelineProjectId(null)}>
                <MdClose />
              </button>
            </div>
            <div className="village-details" style={{ padding: '1.5rem' }}>
              {timelineLoading && <div className="villages-loading">Loading checkpoints...</div>}
              {timelineError && (
                <div className="error-message" role="alert">
                  {timelineError}
                </div>
              )}
              {!timelineLoading && !timelineError && (
                <div className="checkpoints-timeline">
                  {timelineCheckpoints.length === 0 ? (
                    <p>No checkpoints configured for this project yet.</p>
                  ) : (
                    timelineCheckpoints.map((cp) => {
                      const submissions = timelineSubmissionsByCheckpoint[cp.id] || [];
                      return (
                        <div
                          key={cp.id}
                          style={{
                            borderLeft: '3px solid #0f766e',
                            paddingLeft: '1rem',
                            marginBottom: '1.25rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>
                                #{cp.checkpoint_order} — {cp.name}
                              </strong>
                              {cp.description && (
                                <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>
                                  {cp.description}
                                </div>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: '0.8rem',
                                color: '#0f766e',
                                background: '#ecfdf3',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '999px',
                              }}
                            >
                              {submissions.length} submissions
                            </span>
                          </div>
                          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {submissions.length === 0 && (
                              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>No submissions yet.</div>
                            )}
                            {submissions.map((s) => (
                              <div
                                key={s.id}
                                style={{
                                  padding: '0.75rem 0.9rem',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  background:
                                    s.status === 'approved'
                                      ? '#ecfdf3'
                                      : s.status === 'rejected'
                                        ? '#fef2f2'
                                        : s.status === 'requires_revision'
                                          ? '#fffbeb'
                                          : '#ffffff',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.25rem',
                                  }}
                                >
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                    {s.status.toUpperCase()}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    {new Date(s.submitted_at).toLocaleString()}
                                  </div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                                  Submitted by: <strong>{s.submitted_by}</strong>
                                </div>
                                {s.review_notes && (
                                  <div
                                    style={{
                                      marginTop: '0.35rem',
                                      fontSize: '0.8rem',
                                      fontStyle: 'italic',
                                      color: '#6b7280',
                                    }}
                                  >
                                    Note: {s.review_notes}
                                  </div>
                                )}
                                {s.media && s.media.length > 0 && (
                                  <div
                                    style={{
                                      marginTop: '0.35rem',
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      gap: '0.4rem',
                                      fontSize: '0.8rem',
                                    }}
                                  >
                                    {s.media.map((m) => (
                                      <a
                                        key={m.id}
                                        href={m.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '999px',
                                          background: '#eff6ff',
                                          color: '#1d4ed8',
                                          textDecoration: 'none',
                                        }}
                                      >
                                        {m.type || 'file'}
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {/* Employee actions only; officers can just view timeline */}
                                {user?.role === 'employee' && (
                                  <div
                                    style={{
                                      marginTop: '0.5rem',
                                      display: 'flex',
                                      gap: '0.5rem',
                                      flexWrap: 'wrap',
                                      justifyContent: 'flex-end',
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      disabled={timelineReviewLoadingId === s.id}
                                      onClick={() => reviewTimelineSubmission(cp.id, s, 'approved')}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      disabled={timelineReviewLoadingId === s.id}
                                      onClick={() => reviewTimelineSubmission(cp.id, s, 'rejected')}
                                    >
                                      Reject
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      disabled={timelineReviewLoadingId === s.id}
                                      onClick={() => reviewTimelineSubmission(cp.id, s, 'requires_revision')}
                                    >
                                      Request Rework
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="villages-filters">
        <select
          value={filters.state}
          onChange={(e) => setFilters({ ...filters, state: e.target.value, district: '' })}
        >
          <option value="">All States</option>
          {states.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>

        <select
          value={filters.district}
          onChange={(e) => setFilters({ ...filters, district: e.target.value })}
          disabled={!filters.state}
        >
          <option value="">All Districts</option>
          {districts
            .filter(d => !filters.state || villages.find(v => v.state === filters.state && v.district === d))
            .map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
        </select>

        <select
          value={filters.adarsh_candidate}
          onChange={(e) => setFilters({ ...filters, adarsh_candidate: e.target.value })}
        >
          <option value="">All Villages</option>
          <option value="true">Adarsh Candidates Only</option>
        </select>
      </div>

      <div className="villages-content">
        <div className="villages-list">
          <h2>Village List ({villages.length})</h2>
          {villages.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No villages found. {loading ? 'Loading...' : 'Try adjusting your filters.'}
            </div>
          ) : (() => {
            // Group villages by state and sort
            const villagesByState = villages.reduce((acc, village) => {
              const state = village.state || 'Unknown';
              if (!acc[state]) {
                acc[state] = [];
              }
              acc[state].push(village);
              return acc;
            }, {} as Record<string, Village[]>);

            // Sort states alphabetically
            const sortedStates = Object.keys(villagesByState).sort();

            return (
              <div className="villages-by-state">
                {sortedStates.map(state => {
                  const stateVillages = villagesByState[state].sort((a, b) =>
                    a.district.localeCompare(b.district) || a.name.localeCompare(b.name)
                  );
                  return (
                    <div key={state} className="state-group">
                      <h3 className="state-header">
                        <MdLocationOn /> {state} ({stateVillages.length} villages)
                      </h3>
                      <div className="villages-grid">
                        {stateVillages.map(village => (
                          <div
                            key={village.id}
                            className={`village-card ${selectedVillage?.id === village.id ? 'selected' : ''}`}
                            onClick={() => handleViewDetails(village)}
                          >
                            <div className="village-card-header">
                              <h4>{village.name}</h4>
                              {village.is_adarsh_candidate && (
                                <span className="badge adarsh-badge">Adarsh</span>
                              )}
                            </div>
                            <div className="village-card-body">
                              <div className="village-info-item">
                                <strong>District:</strong> {village.district}
                              </div>
                              {village.block && (
                                <div className="village-info-item">
                                  <strong>Block:</strong> {village.block}
                                </div>
                              )}
                              {village.population && (
                                <div className="village-info-item">
                                  <MdPeople /> {village.population.toLocaleString()} people
                                </div>
                              )}
                              <div className="village-info-item">
                                <strong>Adarsh Score:</strong>
                                {village.adarsh_score > 0 ? (
                                  <span className={`score-badge ${village.adarsh_score >= 85 ? 'adarsh' : village.adarsh_score >= 70 ? 'good' : village.adarsh_score >= 50 ? 'average' : 'low'}`}>
                                    {village.adarsh_score.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="score-badge low">N/A</span>
                                )}
                              </div>
                            </div>
                            <div className="village-card-footer">
                              <button
                                className="btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(village);
                                }}
                                style={{ cursor: 'pointer', width: '100%' }}
                              >
                                <MdVisibility /> View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <div className="villages-map">
          <h2>Village Map</h2>
          <div className="map-container">
            <VillageMap
              villages={villages}
              onVillageSelect={(village) => {
                const selected = villages.find(v => v.id === village.id);
                if (selected) {
                  handleViewDetails(selected);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Villages;
