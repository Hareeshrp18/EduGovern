import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import {
  getAllRequests,
  updateRequestStatus,
  deleteRequest,
  getRequestStatistics
} from '../../services/request.service.js';
import './AdminRequests.css';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [adminComment, setAdminComment] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [requesterTypeFilter, setRequesterTypeFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchStatistics();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, statusFilter, typeFilter, requesterTypeFilter, searchTerm]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllRequests();
      setRequests(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch requests');
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await getRequestStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Fetch statistics error:', err);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Filter by request type
    if (typeFilter !== 'All') {
      filtered = filtered.filter(req => req.request_type === typeFilter);
    }

    // Filter by requester type
    if (requesterTypeFilter !== 'All') {
      filtered = filtered.filter(req => req.requester_type === requesterTypeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.subject?.toLowerCase().includes(term) ||
        req.requester_name?.toLowerCase().includes(term) ||
        req.requester_id?.toLowerCase().includes(term) ||
        req.description?.toLowerCase().includes(term)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setActionType('approve');
    setAdminComment('');
    setShowModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setActionType('reject');
    setAdminComment('');
    setShowModal(true);
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setActionType('view');
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      setError('');

      if (actionType === 'approve' || actionType === 'reject') {
        await updateRequestStatus(selectedRequest.id, {
          status: actionType === 'approve' ? 'Approved' : 'Rejected',
          admin_comment: adminComment || null
        });
      }

      await fetchRequests();
      await fetchStatistics();
      setShowModal(false);
      setSelectedRequest(null);
      setAdminComment('');
    } catch (err) {
      setError(err.message || 'Failed to update request');
      console.error('Update request error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteRequest(id);
      await fetchRequests();
      await fetchStatistics();
    } catch (err) {
      setError(err.message || 'Failed to delete request');
      console.error('Delete request error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'status-badge status-approved';
      case 'Rejected':
        return 'status-badge status-rejected';
      case 'Pending':
        return 'status-badge status-pending';
      case 'Cancelled':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge';
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'Leave':
        return 'type-badge type-leave';
      case 'Permission':
        return 'type-badge type-permission';
      case 'Other':
        return 'type-badge type-other';
      default:
        return 'type-badge';
    }
  };

  return (
    <div className="requests-container">
      <Sidebar />
      <div className="requests-main">
          <div className="requests-header">
            <h1>Request Management</h1>
          </div>
        <div className="requests-content">

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Statistics Cards */}
          {statistics && (
            <div className="requests-stats">
              <div className="stat-card">
                
                <div className="stat-info">
                  <div className="stat-value">{statistics.total || 0}</div>
                  <div className="stat-label">Total Requests</div>
                </div>
              </div>
              <div className="stat-card">
                
                <div className="stat-info">
                  <div className="stat-value">{statistics.pending || 0}</div>
                  <div className="stat-label">Pending</div>
                </div>
              </div>
              <div className="stat-card">
                
                <div className="stat-info">
                  <div className="stat-value">{statistics.approved || 0}</div>
                  <div className="stat-label">Approved</div>
                </div>
              </div>
              <div className="stat-card">
                
                <div className="stat-info">
                  <div className="stat-value">{statistics.rejected || 0}</div>
                  <div className="stat-label">Rejected</div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="requests-filters">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Leave">Leave</option>
              <option value="Permission">Permission</option>
              <option value="Other">Other</option>
            </select>

            <select
              className="filter-select"
              value={requesterTypeFilter}
              onChange={(e) => setRequesterTypeFilter(e.target.value)}
            >
              <option value="All">All Requesters</option>
              <option value="student">Students</option>
              <option value="staff">Staff</option>
            </select>

            <input
              type="text"
              className="search-input"
              placeholder="Search by subject, name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Requests Table */}
          <div className="requests-table-container">
            {loading && filteredRequests.length === 0 ? (
              <div className="loading-message">Loading requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="no-data-message">
                <p>No requests found</p>
              </div>
            ) : (
              <div className="requests-table">
                <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Requester</th>
                    <th>Subject</th>
                    <th>Dates</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>#{request.id}</td>
                      <td>
                        <span className={getTypeBadgeClass(request.request_type)}>
                          {request.request_type}
                          {request.request_subtype && ` - ${request.request_subtype}`}
                        </span>
                      </td>
                      <td>
                        <div className="requester-info">
                          <div className="requester-name">{request.requester_name}</div>
                          <div className="requester-details">
                            {request.requester_type === 'student' ? 'Student' : 'Staff'} • {request.requester_id}
                          </div>
                        </div>
                      </td>
                      <td className="subject-cell">{request.subject}</td>
                      <td>
                        {request.start_date && request.end_date ? (
                          <div className="date-range">
                            {formatDate(request.start_date)} - {formatDate(request.end_date)}
                          </div>
                        ) : request.start_date ? (
                          formatDate(request.start_date)
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>
                        {request.duration_days ? `${request.duration_days} day${request.duration_days > 1 ? 's' : ''}` : 'N/A'}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(request.status)}>
                          {request.status}
                        </span>
                      </td>
                      <td>{formatDate(request.created_at)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-view"
                            onClick={() => handleView(request)}
                            title="View Details"
                          >
                            View
                          </button>
                          {request.status === 'Pending' && (
                            <>
                              <button
                                className="btn-approve"
                                onClick={() => handleApprove(request)}
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => handleReject(request)}
                                title="Reject"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(request.id)}
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal */}
          {showModal && selectedRequest && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>
                    {actionType === 'approve' && 'Approve Request'}
                    {actionType === 'reject' && 'Reject Request'}
                    {actionType === 'view' && 'Request Details'}
                  </h2>
                  <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                </div>

                <div className="modal-body">
                  <div className="request-details">
                    <div className="detail-row">
                      <span className="detail-label">Request ID:</span>
                      <span className="detail-value">#{selectedRequest.id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">
                        {selectedRequest.request_type}
                        {selectedRequest.request_subtype && ` - ${selectedRequest.request_subtype}`}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Requester:</span>
                      <span className="detail-value">
                        {selectedRequest.requester_name} ({selectedRequest.requester_type})
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Requester ID:</span>
                      <span className="detail-value">{selectedRequest.requester_id}</span>
                    </div>
                    {selectedRequest.requester_email && (
                      <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{selectedRequest.requester_email}</span>
                      </div>
                    )}
                    {selectedRequest.requester_phone && (
                      <div className="detail-row">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{selectedRequest.requester_phone}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Subject:</span>
                      <span className="detail-value">{selectedRequest.subject}</span>
                    </div>
                    {selectedRequest.start_date && (
                      <div className="detail-row">
                        <span className="detail-label">Start Date:</span>
                        <span className="detail-value">{formatDate(selectedRequest.start_date)}</span>
                      </div>
                    )}
                    {selectedRequest.end_date && (
                      <div className="detail-row">
                        <span className="detail-label">End Date:</span>
                        <span className="detail-value">{formatDate(selectedRequest.end_date)}</span>
                      </div>
                    )}
                    {selectedRequest.duration_days && (
                      <div className="detail-row">
                        <span className="detail-label">Duration:</span>
                        <span className="detail-value">{selectedRequest.duration_days} day(s)</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className={getStatusBadgeClass(selectedRequest.status)}>
                        {selectedRequest.status}
                      </span>
                    </div>
                    <div className="detail-row full-width">
                      <span className="detail-label">Description:</span>
                      <div className="detail-description">{selectedRequest.description}</div>
                    </div>
                    {selectedRequest.admin_comment && (
                      <div className="detail-row full-width">
                        <span className="detail-label">Admin Comment:</span>
                        <div className="detail-description">{selectedRequest.admin_comment}</div>
                      </div>
                    )}
                    {selectedRequest.admin_name && (
                      <div className="detail-row">
                        <span className="detail-label">Reviewed By:</span>
                        <span className="detail-value">{selectedRequest.admin_name}</span>
                      </div>
                    )}
                    {selectedRequest.reviewed_at && (
                      <div className="detail-row">
                        <span className="detail-label">Reviewed At:</span>
                        <span className="detail-value">{formatDate(selectedRequest.reviewed_at)}</span>
                      </div>
                    )}
                  </div>

                  {(actionType === 'approve' || actionType === 'reject') && (
                    <div className="modal-comment">
                      <label htmlFor="adminComment">Admin Comment (Optional):</label>
                      <textarea
                        id="adminComment"
                        className="comment-textarea"
                        value={adminComment}
                        onChange={(e) => setAdminComment(e.target.value)}
                        placeholder="Add a comment about your decision..."
                        rows="4"
                      />
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button className="btn-cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  {(actionType === 'approve' || actionType === 'reject') && (
                    <button
                      className={actionType === 'approve' ? 'btn-confirm-approve' : 'btn-confirm-reject'}
                      onClick={confirmAction}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRequests;
