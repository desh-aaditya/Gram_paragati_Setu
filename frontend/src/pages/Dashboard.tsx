import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Dashboard.css';

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
  recent_activity: any[];
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">{t('common.loading')}</div>;
  }

  if (!data) {
    return <div className="dashboard-error">{t('common.error')}</div>;
  }

  const utilizationRate = data.funds.total_allocated > 0
    ? ((data.funds.total_utilized / data.funds.total_allocated) * 100).toFixed(1)
    : 0;

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">
        {t('dashboard.welcome')}, {user?.fullName}
      </h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>{t('dashboard.totalFunds')}</h3>
          <div className="dashboard-stat-large">
            ₹{(data.funds.total_allocated / 100000).toFixed(2)}L
          </div>
          <div className="dashboard-stat-label">
            {t('dashboard.allocated')}: ₹{(data.funds.total_allocated / 100000).toFixed(2)}L
          </div>
          <div className="dashboard-stat-label">
            {t('dashboard.utilized')}: ₹{(data.funds.total_utilized / 100000).toFixed(2)}L
          </div>
          <div className="dashboard-progress">
            <div 
              className="dashboard-progress-bar"
              style={{ width: `${utilizationRate}%` }}
            ></div>
          </div>
          <div className="dashboard-progress-text">{utilizationRate}% utilized</div>
        </div>

        <div className="dashboard-card">
          <h3>{t('dashboard.villages')}</h3>
          <div className="dashboard-stat-large">{data.villages.total_villages}</div>
          <div className="dashboard-stat-label">
            Adarsh Candidates: {data.villages.adarsh_candidates}
          </div>
          <div className="dashboard-stat-label">
            Avg Score: {data.villages.avg_score.toFixed(1)}
          </div>
        </div>

        <div className="dashboard-card">
          <h3>{t('dashboard.projects')}</h3>
          <div className="dashboard-stat-large">{data.funds.total_projects}</div>
          <div className="dashboard-stat-label">
            Completed: {data.funds.completed_projects}
          </div>
          <div className="dashboard-stat-label">
            In Progress: {data.funds.total_projects - data.funds.completed_projects}
          </div>
        </div>

        <div className="dashboard-card">
          <h3>{t('dashboard.pendingSubmissions')}</h3>
          <div className="dashboard-stat-large">{data.pending_submissions}</div>
          <div className="dashboard-stat-label">Awaiting Review</div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {data.recent_activity.length > 0 ? (
            data.recent_activity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-type">{activity.type}</div>
                <div className="activity-details">
                  <strong>{activity.project_title}</strong> - {activity.village_name}
                </div>
                <div className="activity-time">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <p>No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
