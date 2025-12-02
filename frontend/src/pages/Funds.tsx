import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MdAdd, MdClose, MdTrendingUp, MdTrendingDown, MdHistory } from 'react-icons/md';
import './Funds.css';

interface FundTransaction {
  id: number;
  project_id: number;
  transaction_type: 'allocation' | 'release';
  amount: number;
  description?: string;
  created_at: string;
  project_title?: string;
  village_name?: string;
  approved_by_name?: string;
}

interface Project {
  id: number;
  title: string;
  village_name: string;
  allocated_amount: number;
  utilized_amount: number;
}

const Funds: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllocateForm, setShowAllocateForm] = useState(false);
  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    amount: '',
    description: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
    if (user?.role === 'officer') {
      fetchProjects();
    }
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics/funds');
      setTransactions(response.data);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setError(error.response?.data?.error || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.project_id || !formData.amount) {
      setError('Project and Amount are required');
      return;
    }

    try {
      await api.post('/funds/allocate', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setShowAllocateForm(false);
      setFormData({ project_id: '', amount: '', description: '' });
      fetchTransactions();
      fetchProjects();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to allocate funds');
    }
  };

  const handleRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.project_id || !formData.amount) {
      setError('Project and Amount are required');
      return;
    }

    try {
      await api.post('/funds/release', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setShowReleaseForm(false);
      setFormData({ project_id: '', amount: '', description: '' });
      fetchTransactions();
      fetchProjects();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to release funds');
    }
  };

  if (loading && transactions.length === 0) {
    return <div className="funds-loading">{t('common.loading')}</div>;
  }

  const totalAllocated = transactions
    .filter(t => t.transaction_type === 'allocation')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const totalReleased = transactions
    .filter(t => t.transaction_type === 'release')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  return (
    <div className="funds-page">
      <div className="funds-header">
        <h1>{t('funds.title')}</h1>
        {user?.role === 'officer' && (
          <div className="funds-actions">
            <button className="btn-primary" onClick={() => setShowAllocateForm(true)}>
              <MdTrendingUp /> Allocate Funds
            </button>
            <button className="btn-secondary" onClick={() => setShowReleaseForm(true)}>
              <MdTrendingDown /> Release Funds
            </button>
            <button className="btn-link" onClick={() => setShowHistory(true)}>
              <MdHistory /> View History
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="funds-summary">
        <div className="summary-card">
          <h3>Total Allocated</h3>
          <div className="summary-amount">₹{(totalAllocated / 100000).toFixed(2)}L</div>
        </div>
        <div className="summary-card">
          <h3>Total Released</h3>
          <div className="summary-amount">₹{(totalReleased / 100000).toFixed(2)}L</div>
        </div>
        <div className="summary-card">
          <h3>Available</h3>
          <div className="summary-amount">₹{((totalAllocated - totalReleased) / 100000).toFixed(2)}L</div>
        </div>
      </div>

      {showAllocateForm && (
        <div className="modal-overlay" onClick={() => setShowAllocateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Allocate Funds</h2>
              <button className="modal-close" onClick={() => setShowAllocateForm(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleAllocate} className="fund-form">
              <div className="form-group">
                <label>Project *</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title} - {project.village_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAllocateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReleaseForm && (
        <div className="modal-overlay" onClick={() => setShowReleaseForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Release Funds</h2>
              <button className="modal-close" onClick={() => setShowReleaseForm(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleRelease} className="fund-form">
              <div className="form-group">
                <label>Project *</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title} - {project.village_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowReleaseForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Fund History</h2>
              <button className="modal-close" onClick={() => setShowHistory(false)}>
                <MdClose />
              </button>
            </div>
            <div className="transactions-list">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Project</th>
                    <th>Village</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Approved By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`transaction-badge ${transaction.transaction_type}`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td>{transaction.project_title || 'N/A'}</td>
                      <td>{transaction.village_name || 'N/A'}</td>
                      <td>₹{(parseFloat(transaction.amount.toString()) / 100000).toFixed(2)}L</td>
                      <td>{transaction.description || '-'}</td>
                      <td>{transaction.approved_by_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Funds;
