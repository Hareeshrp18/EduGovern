import { useState, useEffect } from 'react';
import './AdminAnnouncements.css';
import Sidebar from '../../components/layout/Sidebar';
import AnnouncementForm from '../../components/announcements/AnnouncementForm';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById
} from '../../services/announcement.service.js';

/* Admin Announcements Page */
const AdminAnnouncements = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDate, setSelectedDate] = useState('All Dates');

  // Fetch announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Filter announcements based on search, status, and date
  useEffect(() => {
    let filtered = [...announcements];

    // Filter by status
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(announcement => announcement.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(announcement =>
        announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date
    if (selectedDate !== 'All Dates') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(announcement => {
        const announcementDate = new Date(announcement.created_at);
        announcementDate.setHours(0, 0, 0, 0);
        
        if (selectedDate === 'Today') {
          return announcementDate.getTime() === today.getTime();
        } else if (selectedDate === 'This Week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return announcementDate >= weekAgo;
        } else if (selectedDate === 'This Month') {
          return announcementDate.getMonth() === today.getMonth() &&
                 announcementDate.getFullYear() === today.getFullYear();
        }
        return true;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setFilteredAnnouncements(filtered);
  }, [announcements, searchTerm, selectedStatus, selectedDate]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAllAnnouncements();
      setAnnouncements(data);
      setFilteredAnnouncements(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setShowForm(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleViewAnnouncement = async (id) => {
    try {
      const announcement = await getAnnouncementById(id);
      setEditingAnnouncement({ ...announcement, viewOnly: true });
      setShowForm(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch announcement details');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await deleteAnnouncement(id);
      await fetchAnnouncements();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete announcement');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
  };

  const handleSubmitForm = async (announcementData) => {
    try {
      if (editingAnnouncement && !editingAnnouncement.viewOnly) {
        await updateAnnouncement(editingAnnouncement.id, announcementData);
      } else {
        await createAnnouncement(announcementData);
      }
      setShowForm(false);
      setEditingAnnouncement(null);
      await fetchAnnouncements();
    } catch (err) {
      throw err;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published':
        return '#28a745';
      case 'Draft':
        return '#ffc107';
      case 'Scheduled':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const getRecipientLabel = (recipient) => {
    const labels = {
      students: 'Students',
      faculty: 'Faculty',
      transport_manager: 'Transport Manager'
    };
    return labels[recipient] || recipient;
  };

  return (
    <div className='announcements-container'>
      <Sidebar />
      <div className="announcements-page">
        <header className="announcements-header">
          <h1>Announcement</h1>
        </header>

        <main className="announcements-content">
          <div className="announcements-filters">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${selectedStatus === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedStatus('All')}
              >
                All
              </button>
              <button
                className={`filter-btn ${selectedStatus === 'Draft' ? 'active' : ''}`}
                onClick={() => setSelectedStatus('Draft')}
              >
                Draft
              </button>
              <button
                className={`filter-btn ${selectedStatus === 'Published' ? 'active' : ''}`}
                onClick={() => setSelectedStatus('Published')}
              >
                Published
              </button>
              <button
                className={`filter-btn ${selectedStatus === 'Scheduled' ? 'active' : ''}`}
                onClick={() => setSelectedStatus('Scheduled')}
              >
                Scheduled
              </button>
              <select
                className="filter-btn"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                <option value="All Dates">All Dates</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>
            </div>
            <div className="search-promote-section">
              <div className="promote-add-buttons">
                <button className="create-announcement-btn" onClick={handleCreateAnnouncement}>
                  Create Announcement
                </button>
              </div>
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <section className="announcements-list">
            {loading ? (
              <div className="loading-message">Loading announcements...</div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="announcements-placeholder">
                <p>No announcements found. Click "Create Announcement" to add a new one.</p>
              </div>
            ) : (
              <div className="announcements-grid">
                {filteredAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="announcement-card">
                    <div className="announcement-card-header">
                      <h3 className="announcement-title">{announcement.title}</h3>
                      <span
                        className="announcement-status"
                        style={{ backgroundColor: getStatusColor(announcement.status) }}
                      >
                        {announcement.status}
                      </span>
                    </div>
                    <div className="announcement-content-preview">
                      {announcement.content.length > 150
                        ? `${announcement.content.substring(0, 150)}...`
                        : announcement.content}
                    </div>
                    <div className="announcement-meta">
                      <div className="announcement-recipients">
                        <strong>To:</strong>{' '}
                        {announcement.recipients.map((r, idx) => (
                          <span key={idx}>
                            {getRecipientLabel(r)}
                            {idx < announcement.recipients.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                      <div className="announcement-date">
                        {announcement.scheduled_time
                          ? `Scheduled: ${formatDate(announcement.scheduled_time)}`
                          : `Created: ${formatDate(announcement.created_at)}`}
                      </div>
                    </div>
                    <div className="announcement-actions">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleViewAnnouncement(announcement.id)}
                      >
                        View
                      </button>
                      <button
                        className="action-btn update-btn"
                        onClick={() => handleEditAnnouncement(announcement)}
                      >
                        Update
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {showForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isEditing={!!editingAnnouncement && !editingAnnouncement?.viewOnly}
          viewOnly={editingAnnouncement?.viewOnly || false}
        />
      )}
    </div>
  );
};

export default AdminAnnouncements;
