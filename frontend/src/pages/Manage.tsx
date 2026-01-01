import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { MdLocationOn, MdArrowBack } from 'react-icons/md';
import './Manage.css';

interface State {
  name: string;
  village_count: number;
  project_count: number;
  total_funds: number;
}

const Manage: React.FC = () => {
  const navigate = useNavigate();
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all villages
      const villagesResponse = await api.get('/villages');
      const villages = villagesResponse.data || [];

      // Fetch all projects to aggregate by state
      const projectsResponse = await api.get('/projects');
      const projects = projectsResponse.data || [];

      // Group villages by state and aggregate project data
      const stateMap = new Map<string, State>();

      villages.forEach((village: any) => {
        const stateName = village.state || 'Unknown';
        if (!stateMap.has(stateName)) {
          stateMap.set(stateName, {
            name: stateName,
            village_count: 0,
            project_count: 0,
            total_funds: 0,
          });
        }
        const state = stateMap.get(stateName)!;
        state.village_count += 1;
      });

      // Aggregate projects by state
      projects.forEach((project: any) => {
        // Find the village for this project
        const village = villages.find((v: any) => v.id === project.village_id);
        if (village) {
          const stateName = village.state || 'Unknown';
          const state = stateMap.get(stateName);
          if (state) {
            state.project_count += 1;
            state.total_funds += Number(project.allocated_amount || 0);
          }
        }
      });

      setStates(Array.from(stateMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error: any) {
      console.error('Error fetching states:', error);
      let errorMessage = 'Failed to load states';

      if (error.response) {
        if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else if (error.response.status === 404) {
          errorMessage = 'No states found.';
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

  if (loading) {
    return (
      <div className="manage-page">
        <div className="manage-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            <MdArrowBack /> Back to Dashboard
          </button>
          <h1>Manage</h1>
        </div>
        <div className="manage-loading">Loading states...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-page">
        <div className="manage-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            <MdArrowBack /> Back to Dashboard
          </button>
          <h1>Manage</h1>
        </div>
        <div className="manage-error">
          <p>{error}</p>
          <button onClick={fetchStates}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-page">
      <div className="manage-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <MdArrowBack /> Back to Dashboard
        </button>
        <h1>Manage</h1>
      </div>

      {states.length === 0 ? (
        <div className="manage-error" style={{ marginTop: '2rem', padding: '2rem' }}>
          <p>No states found. Please ensure villages are added to the system.</p>
        </div>
      ) : (
        <div className="states-grid">
          {states.map((state) => (
            <div
              key={state.name}
              className="state-card"
              onClick={() => navigate(`/manage/state/${encodeURIComponent(state.name)}`)}
            >
              <div className="state-card-header">
                <MdLocationOn className="state-icon" />
                <h2>{state.name}</h2>
              </div>
              <div className="state-card-body">
                <div className="state-stat">
                  <span className="stat-label">Villages:</span>
                  <span className="stat-value">{state.village_count}</span>
                </div>
                <div className="state-stat">
                  <span className="stat-label">Projects:</span>
                  <span className="stat-value">{state.project_count}</span>
                </div>
                <div className="state-stat">
                  <span className="stat-label">Total Funds:</span>
                  <span className="stat-value">₹{(state.total_funds / 100000).toFixed(2)}L</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Manage;