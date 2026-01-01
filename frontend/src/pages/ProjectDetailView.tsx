import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MdArrowBack, MdAdd, MdClose, MdImage, MdQrCode, MdPrint } from 'react-icons/md';
import QRCode from 'react-qr-code';
import './Manage.css';
import './Tracker.css';

interface Project {
  id: number;
  title: string;
  description?: string;
  project_type: string;
  status: string;
  allocated_amount: number;
  utilized_amount: number;
  completion_percent: number;
  village_name: string;
  village_id: number;
  public_token?: string;
  checkpoints?: any[];
}

interface Submission {
  id: number;
  status: string;
  submitted_by: string;
  submitted_at: string;
  review_notes?: string;
  media?: {
    id: number;
    url: string;
    type: string;
  }[];
}

const ProjectDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]); // Approved photos
  const [submissionsByCheckpoint, setSubmissionsByCheckpoint] = useState<Record<number, Submission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [fundDescription, setFundDescription] = useState('');
  const [expandedCheckpointId, setExpandedCheckpointId] = useState<number | null>(null);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<number | null>(null); // For horizontal tracker

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchSubmissions();
    }
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error: any) {
      console.error('Error fetching project details:', error);
      let errorMessage = 'Failed to load project details';

      if (error.response) {
        if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else if (error.response.status === 404) {
          errorMessage = 'Project not found.';
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

  const fetchSubmissions = async () => {
    if (!projectId) return;
    try {
      // Get all checkpoints for this project
      const projectResponse = await api.get(`/projects/${projectId}`);
      const checkpoints = projectResponse.data.checkpoints || [];

      const subMap: Record<number, Submission[]> = {};
      const allApprovedSubmissions: Submission[] = [];

      for (const checkpoint of checkpoints) {
        try {
          const submissionsResponse = await api.get(`/checkpoints/${checkpoint.id}/submissions`);
          const checkpointSubmissions = submissionsResponse.data || [];

          subMap[checkpoint.id] = checkpointSubmissions;

          // Filter only approved submissions from mobile app (with client_id) for the gallery
          const approvedMobileSubmissions = checkpointSubmissions.filter(
            (s: any) => s.status === 'approved' && s.client_id
          );
          allApprovedSubmissions.push(...approvedMobileSubmissions);
        } catch (err) {
          // Continue if checkpoint submissions fail
        }
      }

      setSubmissionsByCheckpoint(subMap);
      setSubmissions(allApprovedSubmissions);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleReviewSubmission = async (checkpointId: number, submissionId: number, status: string) => {
    if (!window.confirm(`Are you sure you want to ${status} this submission?`)) return;

    // Optional notes
    let notes = '';
    if (status === 'rejected' || status === 'requires_revision') {
      notes = prompt('Enter review notes (reason):') || '';
      if (!notes && status === 'rejected') return; // Require notes for rejection? Optional.
    }

    try {
      await api.post(`/checkpoints/${checkpointId}/submissions/${submissionId}/review`, {
        status,
        review_notes: notes
      });
      // Refresh submissions
      fetchSubmissions();
      fetchProjectDetails(); // To update completion %
    } catch (error: any) {
      alert('Failed to update submission status');
    }
  };

  // Auto-select first pending checkpoint
  useEffect(() => {
    if (project?.checkpoints?.length && Object.keys(submissionsByCheckpoint).length > 0 && !selectedCheckpointId) {
      const sorted = [...project.checkpoints].sort((a: any, b: any) => a.sequence_order - b.sequence_order);
      const firstPending = sorted.find(cp => {
        const subs = submissionsByCheckpoint[cp.id] || [];
        return !subs.some(s => s.status === 'approved');
      });
      setSelectedCheckpointId(firstPending ? firstPending.id : sorted[0].id);
    }
  }, [project, submissionsByCheckpoint]);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !fundAmount) return;

    try {
      setError('');
      await api.post(`/projects/${projectId}/funds`, {
        amount: parseFloat(fundAmount),
        description: fundDescription || 'Additional funds allocation',
      });

      setShowAddFunds(false);
      setFundAmount('');
      setFundDescription('');
      fetchProjectDetails();
    } catch (error: any) {
      console.error('Error adding funds:', error);
      setError(error.response?.data?.error || 'Failed to add funds');
    }
  };

  if (loading) {
    return (
      <div className="village-detail-view">
        <div className="manage-header">
          <button className="back-button" onClick={() => navigate('/manage')}>
            <MdArrowBack /> Back to Manage
          </button>
          <h1>Loading...</h1>
        </div>
        <div className="manage-loading">Loading project details...</div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="village-detail-view">
        <div className="manage-header">
          <button className="back-button" onClick={() => navigate('/manage')}>
            <MdArrowBack /> Back to Manage
          </button>
          <h1>Error</h1>
        </div>
        <div className="manage-error">
          <p>{error}</p>
          <button onClick={fetchProjectDetails}>Retry</button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="village-detail-view">
        <div className="manage-header">
          <button className="back-button" onClick={() => navigate('/manage')}>
            <MdArrowBack /> Back to Manage
          </button>
          <h1>Project Not Found</h1>
        </div>
        <div className="manage-error">
          <p>Project not found</p>
          <button onClick={() => navigate('/manage')}>Go Back to Manage</button>
        </div>
      </div>
    );
  }

  return (
    <div className="village-detail-view">
      <div className="manage-header">
        <button className="back-button" onClick={() => navigate(`/manage/village/${project.village_id}`)}>
          <MdArrowBack /> Back to Village
        </button>
        <h1>{project.title}</h1>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem', padding: '1rem', background: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div className="village-detail-header">
        <div className="village-info-grid">
          <div>
            <strong>Village:</strong> {project.village_name}
          </div>
          <div>
            <strong>Type:</strong> {project.project_type}
          </div>
          <div>
            <strong>Status:</strong> <span className={`status-badge ${project.status}`}>{project.status}</span>
          </div>
          <div>
            <strong>Completion:</strong> {project.completion_percent}%
          </div>
          <div>
            <strong>Allocated:</strong> ₹{(project.allocated_amount / 100000).toFixed(2)}L
          </div>
          <div>
            <strong>Utilized:</strong> ₹{(project.utilized_amount / 100000).toFixed(2)}L
          </div>
        </div>
        {user?.role === 'officer' && (
          <button className="add-project-button" onClick={() => setShowAddFunds(true)} style={{ marginTop: '1rem' }}>
            <MdAdd /> Add Funds
          </button>
        )}
      </div>

      {showAddFunds && (
        <div className="modal-overlay" onClick={() => setShowAddFunds(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Funds to Project</h2>
              <button className="modal-close" onClick={() => setShowAddFunds(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleAddFunds} className="village-form">
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={fundDescription}
                  onChange={(e) => setFundDescription(e.target.value)}
                  rows={3}
                  placeholder="Reason for additional funds..."
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddFunds(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="checkpoints-section" style={{ marginTop: '2rem' }}>
        <h2>Current Progress</h2>

        {/* Horizontal Tracker */}
        {project.checkpoints && project.checkpoints.length > 0 ? (
          <>
            <div className="tracker-container">
              <div className="tracker-steps">
                {project.checkpoints
                  .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
                  .map((checkpoint: any, index: number) => {
                    const subs = submissionsByCheckpoint[checkpoint.id] || [];
                    const isCompleted = subs.some(s => s.status === 'approved');
                    const isSelected = selectedCheckpointId === checkpoint.id;

                    return (
                      <div
                        key={checkpoint.id}
                        className={`tracker-step ${isCompleted ? 'completed' : ''} ${isSelected ? 'active-selection' : ''}`}
                        onClick={() => setSelectedCheckpointId(checkpoint.id)}
                      >
                        <div className="step-circle">
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <div className="step-content">
                          <div className="step-title">{checkpoint.name}</div>
                          <div className="step-desc">{checkpoint.description}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Selected Checkpoint Detail View */}
            {selectedCheckpointId && (
              <div className="tracker-detail-view">
                {(() => {
                  const checkpoint = project.checkpoints.find((c: any) => c.id === selectedCheckpointId);
                  if (!checkpoint) return null;

                  const subs = submissionsByCheckpoint[checkpoint.id] || [];
                  const pendingCount = subs.filter(s => s.status === 'pending').length;
                  const isCompleted = subs.some(s => s.status === 'approved');

                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#333' }}>
                          Step {checkpoint.sequence_order}: {checkpoint.name}
                        </h3>
                        <span className={`status-badge ${isCompleted ? 'completed' : 'pending'}`}>
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{checkpoint.description}</p>

                      <h4>Submissions & Evidence</h4>
                      {subs.length === 0 ? (
                        <p style={{ fontStyle: 'italic', color: '#888', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
                          No submissions received for this step yet.
                        </p>
                      ) : (
                        <div className="submissions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {subs.map(sub => (
                            <div key={sub.id} className="submission-item" style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', borderLeft: `4px solid ${sub.status === 'approved' ? '#4CAF50' : sub.status === 'rejected' ? '#F44336' : '#FF9800'}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <strong>Submitted by: {sub.submitted_by}</strong>
                                <span className={`status-text ${sub.status}`} style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{sub.status.replace('_', ' ')}</span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                                {new Date(sub.submitted_at).toLocaleString()}
                              </div>

                              {sub.media && sub.media.length > 0 && (
                                <div className="submission-media" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                  {sub.media.map(m => (
                                    <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer">
                                      {m.type?.startsWith('image/') ? (
                                        <img src={m.url} alt="Proof" style={{ height: '80px', borderRadius: '4px', border: '1px solid #ddd' }} />
                                      ) : (
                                        <div style={{ height: '80px', width: '80px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>File</div>
                                      )}
                                    </a>
                                  ))}
                                </div>
                              )}

                              {sub.review_notes && (
                                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#e9ecef', borderRadius: '4px', fontSize: '0.85rem' }}>
                                  <strong>Validator Note:</strong> {sub.review_notes}
                                </div>
                              )}

                              {user?.role === 'officer' && sub.status === 'pending' && (
                                <div className="review-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => handleReviewSubmission(checkpoint.id, sub.id, 'approved')}
                                    style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReviewSubmission(checkpoint.id, sub.id, 'rejected')}
                                    style={{ background: '#F44336', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        ) : (
          <p>No checkpoints defined for this project.</p>
        )}
      </div>

      <div className="projects-section">
        <h2>Gallery (All Approved Photos)</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Photos submitted by volunteers and approved by employees
        </p>

        {submissions.length > 0 ? (
          <div className="photos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {submissions.map((submission) => (
              <div key={submission.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
                {submission.media && submission.media.length > 0 ? (
                  submission.media.map((media) => (
                    <div key={media.id} style={{ marginBottom: '0.5rem' }}>
                      {media.type?.startsWith('image/') ? (
                        <img
                          src={media.url}
                          alt={`Submission ${submission.id}`}
                          style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{ padding: '2rem', background: '#f0f0f0', borderRadius: '4px', textAlign: 'center' }}>
                          <MdImage style={{ fontSize: '3rem', color: '#999' }} />
                          <div>File: {media.type || 'Unknown'}</div>
                          <a href={media.url} target="_blank" rel="noopener noreferrer">View File</a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    No media available
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                  <div>Submitted by: {submission.submitted_by}</div>
                  <div>Date: {new Date(submission.submitted_at).toLocaleString()}</div>
                  {submission.review_notes && (
                    <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                      Note: {submission.review_notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No approved photos available for this project yet.
          </p>
        )}
      </div>

      {project.public_token && (
        <div className="qr-section" style={{ marginTop: '2rem', padding: '1rem', background: 'white', border: '1px solid #ddd', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <MdQrCode /> Public Tracking QR Code
            </h2>
            <button
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#003366', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
            >
              <MdPrint /> Print QR
            </button>
          </div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ background: 'white', padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
              <QRCode
                value={`http://192.168.60.58:3001/public/project/${project.public_token}`}
                size={150}
                level="H"
              />
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ marginBottom: '0.5rem', fontWeight: 500 }}>Public Tracking Link:</p>
              <div style={{ background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {`http://192.168.60.58:3001/public/project/${project.public_token}`}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                Tip: Print and display this QR code at the construction site.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailView;