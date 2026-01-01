import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MdClose, MdTrendingUp, MdTrendingDown, MdHistory, MdDownload } from 'react-icons/md';
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
  const [showAllocateForm, setShowAllocateForm] = useState(false);
  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    amount: '',
    tranche: '',
    note: '',
  });
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    start_date: '',
    end_date: '',
  });
  const [summary, setSummary] = useState<{ total_allocated: number; total_utilized: number; remaining: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
    if (user?.role === 'officer') {
      fetchProjects();
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.state) params.append('state', filters.state);
      if (filters.district) params.append('district', filters.district);
      const response = await api.get('/funds/summary', { params });
      const data = response.data || {};
      setSummary({
        total_allocated: Number(data.total_allocated || 0),
        total_utilized: Number(data.total_utilized || 0),
        remaining: Number(data.remaining || 0),
      });
    } catch (err) {
      // keep summary nullable; errors are surfaced via transactions fetch
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.state) params.append('state', filters.state);
      if (filters.district) params.append('district', filters.district);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      const response = await api.get('/funds/transactions', { params });
      setTransactions(response.data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      let errorMessage = 'Failed to fetch transactions';

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
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data || []);
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
        project_id: formData.project_id,
        amount: parseFloat(formData.amount),
        tranche: formData.tranche || undefined,
        note: formData.note || undefined,
      });
      setShowAllocateForm(false);
      setFormData({ project_id: '', amount: '', tranche: '', note: '' });
      fetchTransactions();
      fetchSummary();
      fetchProjects();
    } catch (error: any) {
      let errorMessage = 'Failed to allocate funds';

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
        project_id: formData.project_id,
        amount: parseFloat(formData.amount),
        note: formData.note || undefined,
      });
      setShowReleaseForm(false);
      setFormData({ project_id: '', amount: '', tranche: '', note: '' });
      fetchTransactions();
      fetchSummary();
      fetchProjects();
    } catch (error: any) {
      let errorMessage = 'Failed to release funds';

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
    }
  };

  const totalAllocated = useMemo(() => {
    if (summary) return summary.total_allocated;
    return transactions
      .filter(t => t.transaction_type === 'allocation')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  }, [summary, transactions]);

  const totalReleased = useMemo(() => {
    if (summary) return summary.total_utilized;
    return transactions
      .filter(t => t.transaction_type === 'release')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  }, [summary, transactions]);

  const remaining = useMemo(() => {
    if (summary) return summary.remaining;
    return totalAllocated - totalReleased;
  }, [summary, totalAllocated, totalReleased]);

  const handleExportCsv = () => {
    if (!transactions.length) return;

    const headers = [
      'Date',
      'Type',
      'Project',
      'Village',
      'Amount',
      'Description',
      'Approved By',
    ];

    const rows = transactions.map((t) => [
      new Date(t.created_at).toISOString(),
      t.transaction_type,
      t.project_title || '',
      t.village_name || '',
      t.amount,
      t.description || '',
      t.approved_by_name || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((r) => r.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fund-transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
            <button className="btn-secondary" onClick={handleExportCsv} disabled={!transactions.length}>
              <MdDownload /> Export CSV
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
          <div className="summary-amount">₹{(remaining / 100000).toFixed(2)}L</div>
        </div>
      </div>

      {/* Simple filters row */}
      <div className="funds-filters">
        <input
          type="text"
          placeholder="Filter by State"
          value={filters.state}
          onChange={(e) => setFilters({ ...filters, state: e.target.value })}
        />
        <input
          type="text"
          placeholder="Filter by District"
          value={filters.district}
          onChange={(e) => setFilters({ ...filters, district: e.target.value })}
        />
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
                <label>Tranche</label>
                <input
                  type="text"
                  value={formData.tranche}
                  onChange={(e) => setFormData({ ...formData, tranche: e.target.value })}
                  placeholder="e.g., Tranche 1 / 3"
                />
              </div>
              <div className="form-group">
                <label>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                <label>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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