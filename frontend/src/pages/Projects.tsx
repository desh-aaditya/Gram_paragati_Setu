import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Projects.css';

interface Project {
  id: number;
  title: string;
  project_type: string;
  status: string;
  allocated_amount: number;
  utilized_amount: number;
  village_name: string;
  village_id: number;
}

const Projects: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          <button className="btn-primary">Add Project</button>
        )}
      </div>

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
                <p><strong>Type:</strong> {project.project_type}</p>
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
                <button className="btn-link">View Details</button>
                <button className="btn-link">Checkpoints</button>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="empty-state">
          <p>No projects found</p>
        </div>
      )}
    </div>
  );
};

export default Projects;
