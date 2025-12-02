import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import VillageMap from '../components/VillageMap';
import { MdAdd, MdLocationOn, MdPeople, MdTrendingUp, MdEdit, MdClose } from 'react-icons/md';
import './Villages.css';

interface Village {
  id: number;
  name: string;
  state: string;
  district: string;
  block?: string;
  population: number;
  adarsh_score: number;
  is_adarsh_candidate: boolean;
  latitude: number;
  longitude: number;
  geometry: any;
  baseline_metrics?: any;
  score_breakdown?: any;
}

const Villages: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchVillages();
  }, [filters]);

  const fetchVillages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.state) params.append('state', filters.state);
      if (filters.district) params.append('district', filters.district);
      if (filters.adarsh_candidate) params.append('adarsh_candidate', filters.adarsh_candidate);

      const response = await api.get(`/villages?${params.toString()}`);
      setVillages(response.data);
    } catch (error: any) {
      console.error('Error fetching villages:', error);
      setError(error.response?.data?.error || 'Failed to fetch villages');
    } finally {
      setLoading(false);
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
      await api.post('/villages', {
        ...formData,
        population: formData.population ? parseInt(formData.population) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      });
      setShowAddForm(false);
      setFormData({ name: '', state: '', district: '', block: '', population: '', latitude: '', longitude: '' });
      fetchVillages();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create village');
    }
  };

  const handleViewDetails = async (village: Village) => {
    try {
      const response = await api.get(`/villages/${village.id}`);
      setSelectedVillage(response.data);
      setShowDetails(true);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch village details');
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
            <MdAdd /> Add Village
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
              <h2>Add Village</h2>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleAddVillage} className="village-form">
              <div className="form-group">
                <label>Village Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>District *</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Block/Taluka</label>
                  <input
                    type="text"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Population</label>
                  <input
                    type="number"
                    value={formData.population}
                    onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                  />
                </div>
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
            <div className="village-details">
              <div className="details-grid">
                <div className="detail-item">
                  <strong>State:</strong> {selectedVillage.state}
                </div>
                <div className="detail-item">
                  <strong>District:</strong> {selectedVillage.district}
                </div>
                {selectedVillage.block && (
                  <div className="detail-item">
                    <strong>Block:</strong> {selectedVillage.block}
                  </div>
                )}
                {selectedVillage.population && (
                  <div className="detail-item">
                    <strong>Population:</strong> {selectedVillage.population.toLocaleString()}
                  </div>
                )}
                <div className="detail-item">
                  <strong>Adarsh Score:</strong>
                  <span className={`score-badge ${selectedVillage.adarsh_score >= 85 ? 'adarsh' : ''}`}>
                    {selectedVillage.adarsh_score.toFixed(1)}
                  </span>
                </div>
                {selectedVillage.is_adarsh_candidate && (
                  <div className="detail-item">
                    <span className="badge adarsh-badge">Adarsh Candidate</span>
                  </div>
                )}
              </div>
              {selectedVillage.score_breakdown && (
                <div className="score-breakdown">
                  <h3>Score Breakdown</h3>
                  <div className="breakdown-grid">
                    {Object.entries(selectedVillage.score_breakdown).map(([key, value]: [string, any]) => (
                      <div key={key} className="breakdown-item">
                        <strong>{key.replace(/_/g, ' ')}:</strong> {value.toFixed(1)}
                      </div>
                    ))}
                  </div>
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
        <div className="villages-map">
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

        <div className="villages-list">
          <h2>Village List ({villages.length})</h2>
          <div className="villages-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Population</th>
                  <th>Adarsh Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {villages.map(village => (
                  <tr 
                    key={village.id}
                    className={selectedVillage?.id === village.id ? 'selected' : ''}
                  >
                    <td>{village.name}</td>
                    <td>{village.state}</td>
                    <td>{village.district}</td>
                    <td>{village.population ? village.population.toLocaleString() : '-'}</td>
                    <td>
                      <span className={`score-badge ${village.adarsh_score >= 85 ? 'adarsh' : ''}`}>
                        {village.adarsh_score.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      {village.is_adarsh_candidate && (
                        <span className="badge adarsh-badge">Adarsh</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-link" onClick={() => handleViewDetails(village)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Villages;
