import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Analytics.css';

interface DashboardData {
  funds: {
    total_allocated: number;
    total_utilized: number;
    total_projects: number;
    completed_projects: number;
  };
  villages: {
    total_villages: number;
    adarsh_candidates: number;
    avg_score: number;
  };
  pending_submissions: number;
}

interface AdarshDistribution {
  score_category: string;
  village_count: number;
}

const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [distribution, setDistribution] = useState<AdarshDistribution[]>([]);
  const [villageSummary, setVillageSummary] = useState<any[]>([]);
  const [fundHeatmap, setFundHeatmap] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ state: '', district: '', village_id: '', start_date: '', end_date: '', project_type: '' });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  /* Locations state for dropdowns */
  const [locations, setLocations] = useState<{ id: string; name: string; state: string; district: string }[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableVillages, setAvailableVillages] = useState<{ id: string; name: string }[]>([]);

  // Fetch all locations for dropdowns on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Fetch all villages to get complete hierarchy mapping
        const response = await api.get('/villages');
        const allVillages = response.data || [];

        const locs = allVillages.map((v: any) => ({
          id: v.id,
          name: v.name,
          state: v.state,
          district: v.district,
        }));
        setLocations(locs);

        // Extract unique states
        const states = Array.from(new Set(locs.map((l: any) => l.state))).sort() as string[];
        setAvailableStates(states);

        // Initial villages list (all)
        setAvailableVillages(locs.sort((a: any, b: any) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    };
    fetchLocations();
  }, []);

  // Update available districts and villages when state changes
  useEffect(() => {
    let filteredLocs = locations;

    if (filters.state) {
      filteredLocs = filteredLocs.filter((l) => l.state === filters.state);
    }

    // Update districts based on state selection
    const districts = Array.from(new Set(filteredLocs.map((l) => l.district))).sort() as string[];
    setAvailableDistricts(districts);

    // If district is selected but not in the new state list, it will be cleared by the change handler
    // Logic continues in next effect for district change
  }, [filters.state, locations]);

  // Update available villages when district (or state) changes
  useEffect(() => {
    let filteredLocs = locations;

    if (filters.state) {
      filteredLocs = filteredLocs.filter((l) => l.state === filters.state);
    }

    if (filters.district) {
      filteredLocs = filteredLocs.filter((l) => l.district === filters.district);
    }

    setAvailableVillages(filteredLocs.sort((a, b) => a.name.localeCompare(b.name)));
  }, [filters.state, filters.district, locations]);

  // Debounce filter changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [debouncedFilters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const filterParams = {
        state: debouncedFilters.state || undefined,
        district: debouncedFilters.district || undefined,
        village_id: debouncedFilters.village_id || undefined,
        from: debouncedFilters.start_date || undefined,
        to: debouncedFilters.end_date || undefined,
        project_type: debouncedFilters.project_type || undefined,
      };

      const [dashboardResponse, distributionResponse, stateResponse] = await Promise.all([
        api.get('/analytics/dashboard', { params: filterParams }).catch(err => ({ data: null, error: err })),
        api.get('/analytics/adarsh-distribution', { params: filterParams }).catch(err => ({ data: [], error: err })),
        /* We use stateResponse for the grid below, but we fetch separate location data for dropdowns above */
        api.get('/analytics/state', { params: filterParams }).catch(err => ({ data: {}, error: err })),
      ]);

      const d = dashboardResponse.data || dashboardResponse || {};

      const safeDashboard: DashboardData = {
        funds: {
          total_allocated: Number(d.funds?.total_allocated || 0),
          total_utilized: Number(d.funds?.total_utilized || 0),
          total_projects: Number(d.funds?.total_projects || 0),
          completed_projects: Number(d.funds?.completed_projects || 0),
        },
        villages: {
          total_villages: Number(d.villages?.total_villages || 0),
          adarsh_candidates: Number(d.villages?.adarsh_candidates || 0),
          avg_score: Number(d.villages?.avg_score || 0),
        },
        pending_submissions: Number(d.pending_submissions || 0),
      };

      const safeDistribution: AdarshDistribution[] = Array.isArray(distributionResponse.data)
        ? distributionResponse.data.map((item: any) => ({
          score_category: item.score_category || '',
          village_count: Number(item.village_count || 0),
        }))
        : [];

      setDashboardData(safeDashboard);
      setDistribution(safeDistribution);

      const stateData = stateResponse.data || stateResponse || {};
      setVillageSummary(Array.isArray(stateData.summary) ? stateData.summary : []);
      setFundHeatmap(Array.isArray(stateData.funds) ? stateData.funds : []);

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      let errorMessage = 'Failed to load analytics data';

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

  if (loading) {
    return <div className="analytics-loading">{t('common.loading')}</div>;
  }

  if (error) {
    return (
      <div className="analytics-error">
        <p>{error}</p>
        <button onClick={fetchAnalytics}>Retry</button>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="analytics-error">{t('common.error')}</div>;
  }

  const totalAllocated = Number(dashboardData.funds.total_allocated || 0);
  const totalUtilized = Number(dashboardData.funds.total_utilized || 0);

  const utilizationRate =
    totalAllocated > 0
      ? ((totalUtilized / totalAllocated) * 100).toFixed(1)
      : 0;

  const fundData = [
    {
      name: 'Allocated',
      amount: totalAllocated / 100000,
    },
    {
      name: 'Utilized',
      amount: totalUtilized / 100000,
    },
  ];

  const projectStatusData = [
    {
      name: 'Completed',
      value: dashboardData.funds.completed_projects,
    },
    {
      name: 'In Progress',
      value: dashboardData.funds.total_projects - dashboardData.funds.completed_projects,
    },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="analytics-page">
      <h1>{t('analytics.title')}</h1>

      {/* Filters row */}
      <div className="analytics-filters">
        <select
          value={filters.state}
          onChange={(e) => setFilters({ ...filters, state: e.target.value, district: '', village_id: '' })} // Clear dependent fields
          className="filter-select"
        >
          <option value="">All States</option>
          {availableStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        <select
          value={filters.district}
          onChange={(e) => setFilters({ ...filters, district: e.target.value, village_id: '' })} // Clear village on district change
          className="filter-select"
        >
          <option value="">All Districts</option>
          {availableDistricts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>

        <select
          value={filters.village_id}
          onChange={(e) => setFilters({ ...filters, village_id: e.target.value })}
          className="filter-select"
        >
          <option value="">All Villages</option>
          {availableVillages.map((village) => (
            <option key={village.id} value={village.id}>
              {village.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
        />
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
        />
        <select
          value={filters.project_type}
          onChange={(e) => setFilters({ ...filters, project_type: e.target.value })}
        >
          <option value="">All Project Types</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="education">Education</option>
          <option value="healthcare">Healthcare</option>
          <option value="livelihood">Livelihood</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Fund Utilization</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={fundData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}L`} />
              <Legend />
              <Bar dataKey="amount" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
          <div className="utilization-info">
            <p>
              Utilization Rate: <strong>{utilizationRate}%</strong>
            </p>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Project Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#0f766e"
                dataKey="value"
              >
                {projectStatusData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-card">
          <h3>Adarsh Score Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="score_category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="village_count" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-card">
          <h3>Village Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Total Villages</div>
              <div className="stat-value">{dashboardData.villages.total_villages}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Adarsh Candidates</div>
              <div className="stat-value">{dashboardData.villages.adarsh_candidates}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Average Score</div>
              <div className="stat-value">
                {Number(dashboardData.villages.avg_score || 0).toFixed(1)}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Pending Submissions</div>
              <div className="stat-value">{dashboardData.pending_submissions}</div>
            </div>
          </div>
        </div>

        {/* District / state overview grid */}
        <div className="analytics-card">
          <h3>District Overview</h3>
          <div className="district-table-wrapper">
            <table className="district-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>District</th>
                  <th>Villages</th>
                  <th>Adarsh</th>
                  <th>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {villageSummary.map((row: any, idx: number) => (
                  <tr key={idx}>
                    <td>{row.state}</td>
                    <td>{row.district}</td>
                    <td>{row.total_villages}</td>
                    <td>{row.adarsh_villages}</td>
                    <td>{Number(row.avg_score || 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simple fund heatmap by district/state as bar chart */}
        <div className="analytics-card">
          <h3>Fund Utilization by District</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={fundHeatmap}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="district" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="allocated" name="Allocated" fill="#0ea5e9" />
              <Bar dataKey="utilized" name="Utilized" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>


      </div>
    </div>
  );
};

export default Analytics;

