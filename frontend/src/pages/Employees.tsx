import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MdAdd, MdClose, MdEdit } from 'react-icons/md';
import './Employees.css';

interface Employee {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  department?: string;
  is_active: boolean;
  assigned_villages_count: number;
}

interface Village {
  id: number;
  name: string;
  state: string;
  district: string;
}

const Employees: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    department: '',
  });
  const [selectedVillages, setSelectedVillages] = useState<number[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'officer') {
      fetchEmployees();
      fetchVillages();
    }
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      setError(error.response?.data?.error || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchVillages = async () => {
    try {
      const response = await api.get('/villages');
      setVillages(response.data);
    } catch (error) {
      console.error('Error fetching villages:', error);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
      setError('Username, Email, Password, and Full Name are required');
      return;
    }

    try {
      await api.post('/employees', {
        ...formData,
        village_ids: selectedVillages,
      });
      setShowAddForm(false);
      setFormData({ username: '', email: '', password: '', full_name: '', phone: '', department: '' });
      setSelectedVillages([]);
      fetchEmployees();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create employee');
    }
  };

  const handleAssignVillages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignForm) return;

    try {
      await api.put(`/employees/${showAssignForm.id}/villages`, {
        village_ids: selectedVillages,
      });
      setShowAssignForm(null);
      setSelectedVillages([]);
      fetchEmployees();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update village assignments');
    }
  };

  if (user?.role !== 'officer') {
    return <div className="employees-error">Access denied. Officer access required.</div>;
  }

  if (loading && employees.length === 0) {
    return <div className="employees-loading">{t('common.loading')}</div>;
  }

  return (
    <div className="employees-page">
      <div className="employees-header">
        <h1>Employee Management</h1>
        <button className="btn-primary" onClick={() => setShowAddForm(true)}>
          <MdAdd /> Add Employee
        </button>
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
              <h2>Add Employee</h2>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="employee-form">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Assign Villages</label>
                <div className="village-selector">
                  {villages.map(village => (
                    <label key={village.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedVillages.includes(village.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVillages([...selectedVillages, village.id]);
                          } else {
                            setSelectedVillages(selectedVillages.filter(id => id !== village.id));
                          }
                        }}
                      />
                      <span>{village.name} - {village.district}, {village.state}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignForm && (
        <div className="modal-overlay" onClick={() => setShowAssignForm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Villages - {showAssignForm.full_name}</h2>
              <button className="modal-close" onClick={() => setShowAssignForm(null)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleAssignVillages} className="employee-form">
              <div className="form-group">
                <label>Select Villages</label>
                <div className="village-selector">
                  {villages.map(village => (
                    <label key={village.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedVillages.includes(village.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVillages([...selectedVillages, village.id]);
                          } else {
                            setSelectedVillages(selectedVillages.filter(id => id !== village.id));
                          }
                        }}
                      />
                      <span>{village.name} - {village.district}, {village.state}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAssignForm(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="employees-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Department</th>
              <th>Assigned Villages</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td>{employee.full_name}</td>
                <td>{employee.username}</td>
                <td>{employee.email}</td>
                <td>{employee.department || '-'}</td>
                <td>{employee.assigned_villages_count}</td>
                <td>
                  <span className={`status-badge ${employee.is_active ? 'active' : 'inactive'}`}>
                    {employee.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-link"
                    onClick={() => {
                      setShowAssignForm(employee);
                      // Fetch current assignments
                      api.get(`/employees/${employee.id}/villages`).then(res => {
                        setSelectedVillages(res.data.map((v: any) => v.village_id));
                      }).catch(() => {
                        setSelectedVillages([]);
                      });
                    }}
                  >
                    <MdEdit /> Assign Villages
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employees;
