import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [distribution, setDistribution] = useState<AdarshDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ state: '', district: '', start_date: '', end_date: '' });

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, distributionResponse] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/adarsh-distribution'),
      ]);
      setDashboardData(dashboardResponse.data);
      setDistribution(distributionResponse.data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="analytics-loading">{t('common.loading')}</div>;
  }

  if (!dashboardData) {
    return <div className="analytics-error">{t('common.error')}</div>;
  }

  const utilizationRate = dashboardData.funds.total_allocated > 0
    ? ((dashboardData.funds.total_utilized / dashboardData.funds.total_allocated) * 100).toFixed(1)
    : 0;

  const fundData = [
    {
      name: 'Allocated',
      amount: dashboardData.funds.total_allocated / 100000,
    },
    {
      name: 'Utilized',
      amount: dashboardData.funds.total_utilized / 100000,
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

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Fund Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fundData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}L`} />
              <Legend />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
          <div className="utilization-info">
            <p>Utilization Rate: <strong>{utilizationRate}%</strong></p>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Project Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-card">
          <h3>Adarsh Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="score_category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="village_count" fill="#82ca9d" />
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
              <div className="stat-value">{dashboardData.villages.avg_score.toFixed(1)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Pending Submissions</div>
              <div className="stat-value">{dashboardData.pending_submissions}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
