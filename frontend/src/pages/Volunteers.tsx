import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MdAdd, MdClose, MdEdit, MdLocationOn, MdVisibility, MdVisibilityOff, MdDelete } from 'react-icons/md';
import './Volunteers.css';

interface Volunteer {
  id: number;
  username: string;
  full_name: string;
  phone?: string;
  email?: string;
  employee_id: number;
  employee_name?: string;
  assigned_villages: number[];
  is_active: boolean;
  created_at: string;
}

interface Village {
  id: number;
  name: string;
  state: string;
  district: string;
}

const Volunteers: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<Volunteer | null>(null);
  const [showAssignForm, setShowAssignForm] = useState<Volunteer | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
    email: '',
  });
  const [selectedVillages, setSelectedVillages] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      fetchVolunteers();
      fetchVillages();
    }
  }, [user]);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/volunteers');
      setVolunteers(response.data);
    } catch (error: any) {
      console.error('Error fetching volunteers:', error);
      setError(error.response?.data?.error || 'Failed to fetch volunteers');
    } finally {
      setLoading(false);
    }
  };

  const fetchVillages = async () => {
    try {
      // Employees can only assign their own villages to volunteers
      const response = await api.get('/villages');
      setVillages(response.data);
    } catch (error) {
      console.error('Error fetching villages:', error);
    }
  };

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password || !formData.full_name) {
      setError('Username, Password, and Full Name are required');
      return;
    }

    try {
      await api.post('/volunteers', {
        ...formData,
        village_ids: selectedVillages,
      });
      setShowAddForm(false);
      setFormData({ username: '', password: '', full_name: '', phone: '', email: '' });
      setSelectedVillages([]);
      fetchVolunteers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create volunteer');
    }
  };

  const handleEditVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditForm) return;
    setError('');

    try {
      await api.put(`/volunteers/${showEditForm.id}`, {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        is_active: true,
      });
      setShowEditForm(null);
      setFormData({ username: '', password: '', full_name: '', phone: '', email: '' });
      fetchVolunteers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update volunteer');
    }
  };

  const handleUpdatePassword = async (volunteerId: number) => {
    const newPassword = prompt('Enter new password for volunteer:');
    if (!newPassword) return;

    try {
      await api.put(`/volunteers/${volunteerId}/password`, { password: newPassword });
      alert('Password updated successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update password');
    }
  };

  const handleAssignVillages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignForm) return;

    try {
      await api.put(`/volunteers/${showAssignForm.id}`, {
        village_ids: selectedVillages,
      });
      setShowAssignForm(null);
      setSelectedVillages([]);
      fetchVolunteers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update village assignments');
    }
  };

  const handleDeleteVolunteer = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this volunteer?')) {
      return;
    }

    try {
      await api.delete(`/volunteers/${id}`);
      fetchVolunteers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to deactivate volunteer');
    }
  };

  if (!user) {
    return <div className="volunteers-error">Please login to access this page.</div>;
  }

  // Officers should not access volunteer management from the web portal.
  if (user.role !== 'employee') {
    return <div className="volunteers-error">Access denied. Volunteer management is available for employees only.</div>;
  }

  if (loading && volunteers.length === 0) {
    return <div className="volunteers-loading">{t('common.loading')}</div>;
  }

  return (
    <div className="volunteers-page">
      <div className="page-header">
        <h1>Manage Volunteers</h1>
        <p>Create and manage volunteers for the mobile app</p>
        {user.role === 'employee' && (
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <MdAdd /> Add Volunteer
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Add Volunteer Form */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Volunteer</h2>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleAddVolunteer}>
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
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
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Assign Villages</label>
                <select
                  multiple
                  value={selectedVillages.map(String)}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => Number(option.value));
                    setSelectedVillages(values);
                  }}
                  style={{ minHeight: '150px' }}
                >
                  {villages.map((village) => (
                    <option key={village.id} value={village.id}>
                      {village.name} - {village.district}, {village.state}
                    </option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple villages</small>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Create Volunteer</button>
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Volunteer Form */}
      {showEditForm && (
        <div className="modal-overlay" onClick={() => setShowEditForm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Volunteer</h2>
              <button className="modal-close" onClick={() => setShowEditForm(null)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleEditVolunteer}>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={showEditForm.username} disabled />
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
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Update Volunteer</button>
                <button type="button" className="btn-secondary" onClick={() => setShowEditForm(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Villages Form */}
      {showAssignForm && (
        <div className="modal-overlay" onClick={() => setShowAssignForm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Villages to {showAssignForm.full_name}</h2>
              <button className="modal-close" onClick={() => setShowAssignForm(null)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleAssignVillages}>
              <div className="form-group">
                <label>Select Villages</label>
                <select
                  multiple
                  value={selectedVillages.map(String)}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => Number(option.value));
                    setSelectedVillages(values);
                  }}
                  style={{ minHeight: '200px' }}
                >
                  {villages.map((village) => (
                    <option key={village.id} value={village.id}>
                      {village.name} - {village.district}, {village.state}
                    </option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple villages</small>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Update Assignments</button>
                <button type="button" className="btn-secondary" onClick={() => setShowAssignForm(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="volunteers-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Assigned Villages</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map((volunteer) => (
              <tr key={volunteer.id}>
                <td>{volunteer.full_name}</td>
                <td>{volunteer.username}</td>
                <td>{volunteer.phone || '-'}</td>
                <td>{volunteer.email || '-'}</td>
                <td>{volunteer.assigned_villages?.length || 0}</td>
                <td>
                  <span className={`status-badge ${volunteer.is_active ? 'active' : 'inactive'}`}>
                    {volunteer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-link"
                      onClick={() => {
                        setShowEditForm(volunteer);
                        setFormData({
                          username: volunteer.username,
                          password: '',
                          full_name: volunteer.full_name,
                          phone: volunteer.phone || '',
                          email: volunteer.email || '',
                        });
                        setError('');
                      }}
                    >
                      <MdEdit /> Edit
                    </button>
                    <button
                      className="btn-link"
                      onClick={() => {
                        setShowAssignForm(volunteer);
                        setSelectedVillages(volunteer.assigned_villages || []);
                        setError('');
                      }}
                    >
                      <MdLocationOn /> Assign
                    </button>
                    <button
                      className="btn-link"
                      onClick={() => handleUpdatePassword(volunteer.id)}
                    >
                      Password
                    </button>
                    {volunteer.is_active && (
                      <button
                        className="btn-link"
                        onClick={() => handleDeleteVolunteer(volunteer.id)}
                        style={{ color: '#dc3545' }}
                      >
                        <MdDelete /> Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {volunteers.length === 0 && (
          <div className="empty-state">
            <p>No volunteers found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Volunteers;

