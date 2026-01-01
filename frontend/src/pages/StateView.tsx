import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { MdArrowBack, MdLocationOn } from 'react-icons/md';
import './Manage.css';

interface Village {
  id: number;
  name: string;
  district: string;
  block?: string;
  population?: number;
  adarsh_score: number;
  projects?: any[];
}

interface DistrictGroup {
  district: string;
  villages: Village[];
}

const StateView: React.FC = () => {
  const { stateName } = useParams<{ stateName: string }>();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<DistrictGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('StateView component mounted');
    console.log('stateName from useParams:', stateName);

    if (stateName) {
      try {
        const decodedStateName = decodeURIComponent(stateName);
        console.log('Fetching villages for decoded state:', decodedStateName);
        fetchVillagesByState(decodedStateName);
      } catch (e) {
        console.error('Error decoding state name:', e);
        setError('Invalid state name in URL');
        setLoading(false);
      }
    } else {
      console.error('StateView: stateName is missing from URL params');
      setError('State name is missing from the URL');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateName]);

  const fetchVillagesByState = async (state: string) => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching villages for state:', state);
      const response = await api.get(`/villages?state=${encodeURIComponent(state)}`);
      console.log('Villages response:', response.data);
      const rawVillages = Array.isArray(response.data) ? response.data : [];

      // Ensure all village data is properly typed and numbers are converted
      const villages: Village[] = rawVillages.map((v: any) => ({
        id: v.id,
        name: v.name || '',
        district: v.district || 'Unknown',
        block: v.block,
        population: v.population ? Number(v.population) : undefined,
        adarsh_score: Number(v.adarsh_score || 0),
        projects: v.projects || [],
      }));

      // Group villages by district
      const districtMap = new Map<string, Village[]>();

      villages.forEach((village) => {
        const district = village.district || 'Unknown';
        if (!districtMap.has(district)) {
          districtMap.set(district, []);
        }
        districtMap.get(district)!.push(village);
      });

      const districtGroups: DistrictGroup[] = Array.from(districtMap.entries())
        .map(([district, villages]) => ({
          district,
          villages: villages.sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => a.district.localeCompare(b.district));

      console.log('District groups:', districtGroups);
      setDistricts(districtGroups);
    } catch (error: any) {
      console.error('Error fetching villages:', error);
      let errorMessage = 'Failed to load villages';

      if (error.response) {
        // Server responded with error status
        if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else if (error.response.status === 404) {
          errorMessage = 'No villages found for this state.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to view this data.';
        } else {
          errorMessage = error.response?.data?.error
            || error.response?.data?.message
            || `Server error (${error.response.status}). Please try again.`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!stateName) {
    return (
      <div className="state-view">
        <div className="manage-header">
          <button className="back-button" onClick={() => navigate('/manage')}>
            <MdArrowBack /> Back to States
          </button>
          <h1>State Not Found</h1>
        </div>
        <div className="manage-error">
          <p>State name is missing from the URL.</p>
          <button onClick={() => navigate('/manage')}>Go Back to States</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="state-view">
        <div className="manage-header">
          <button className="back-button" onClick={() => navigate('/manage')}>
            <MdArrowBack /> Back to States
          </button>
          <h1>{decodeURIComponent(stateName)}</h1>
        </div>
        <div className="manage-loading">Loading villages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-view">
        <div className="manage-header">
          <button className="back-button" onClick={() => navigate('/manage')}>
            <MdArrowBack /> Back to States
          </button>
          <h1>{decodeURIComponent(stateName)}</h1>
        </div>
        <div className="manage-error">
          <p>{error}</p>
          <button onClick={() => fetchVillagesByState(decodeURIComponent(stateName))}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="state-view">
      <div className="manage-header">
        <button className="back-button" onClick={() => navigate('/manage')}>
          <MdArrowBack /> Back to States
        </button>
        <h1>{decodeURIComponent(stateName)}</h1>
      </div>

      {districts.length === 0 ? (
        <div className="manage-error" style={{ marginTop: '2rem', padding: '2rem' }}>
          <p>No villages found for this state.</p>
          <button onClick={() => navigate('/manage')} style={{ marginTop: '1rem' }}>Go Back to States</button>
        </div>
      ) : (
        <div className="districts-section">
          {districts.map((districtGroup) => (
            <div key={districtGroup.district} className="district-group">
              <div className="district-header">
                <h3>
                  <MdLocationOn /> {districtGroup.district}
                </h3>
                <span className="village-count">{districtGroup.villages.length} villages</span>
              </div>
              <div className="villages-list">
                {districtGroup.villages.map((village) => (
                  <div
                    key={village.id}
                    className="village-item"
                    onClick={() => navigate(`/manage/village/${village.id}`)}
                  >
                    <h4>{village.name}</h4>
                    <div className="village-item-info">
                      {village.block && <div>Block: {village.block}</div>}
                      {village.population && <div>Population: {village.population.toLocaleString()}</div>}
                      <div>Adarsh Score: {Number(village.adarsh_score || 0).toFixed(1)}%</div>
                      {village.projects && <div>Projects: {village.projects.length}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StateView;