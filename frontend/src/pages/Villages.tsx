import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import VillageMap from '../components/VillageMap';
import './Villages.css';

interface Village {
  id: number;
  name: string;
  state: string;
  district: string;
  population: number;
  adarsh_score: number;
  is_adarsh_candidate: boolean;
  latitude: number;
  longitude: number;
  geometry: any;
}

const Villages: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [filters, setFilters] = useState({ state: '', district: '', adarsh_candidate: '' });

  useEffect(() => {
    fetchVillages();
  }, [filters]);

  const fetchVillages = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.state) params.append('state', filters.state);
      if (filters.district) params.append('district', filters.district);
      if (filters.adarsh_candidate) params.append('adarsh_candidate', filters.adarsh_candidate);

      const response = await api.get(`/villages?${params.toString()}`);
      setVillages(response.data);
    } catch (error) {
      console.error('Error fetching villages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="villages-loading">{t('common.loading')}</div>;
  }

  const states = Array.from(new Set(villages.map(v => v.state))).sort();
  const districts = Array.from(new Set(villages.map(v => v.district))).sort();

  return (
    <div className="villages-page">
      <div className="villages-header">
        <h1>{t('villages.title')}</h1>
        {user?.role === 'officer' && (
          <button className="btn-primary">Add Village</button>
        )}
      </div>

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
          <VillageMap villages={villages} onVillageSelect={setSelectedVillage} />
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
                    onClick={() => setSelectedVillage(village)}
                  >
                    <td>{village.name}</td>
                    <td>{village.state}</td>
                    <td>{village.district}</td>
                    <td>{village.population || '-'}</td>
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
                      <button className="btn-link">View</button>
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
