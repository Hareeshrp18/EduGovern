import { useState, useEffect } from 'react';
import './AnnouncementForm.css';

/**
 * Announcement Form Component
 * Used for both creating and editing announcements
 */
const AnnouncementForm = ({ announcement, onClose, onSubmit, isEditing = false, viewOnly = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    recipients: [],
    scheduled_time: '',
    status: 'Draft'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const recipientOptions = [
    { id: 'students', label: 'Students' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'transport_manager', label: 'Transport Manager' }
  ];

  // Populate form if editing or viewing
  useEffect(() => {
    if (announcement && (isEditing || viewOnly)) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        recipients: announcement.recipients || [],
        scheduled_time: announcement.scheduled_time ? announcement.scheduled_time.slice(0, 16) : '',
        status: announcement.status || 'Draft'
      });
    }
  }, [announcement, isEditing, viewOnly]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRecipientChange = (recipientId) => {
    setFormData(prev => {
      const recipients = prev.recipients.includes(recipientId)
        ? prev.recipients.filter(r => r !== recipientId)
        : [...prev.recipients, recipientId];
      return { ...prev, recipients };
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (formData.recipients.length === 0) {
      newErrors.recipients = 'At least one recipient must be selected';
    }

    if (formData.status === 'Scheduled' && !formData.scheduled_time) {
      newErrors.scheduled_time = 'Scheduled time is required for scheduled announcements';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Don't submit if in view-only mode
    if (viewOnly) {
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        scheduled_time: formData.scheduled_time || null
      };
      await onSubmit(submitData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="announcement-form-overlay" onClick={onClose}>
      <div className="announcement-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="announcement-form-header">
          <h2>{viewOnly ? 'View Announcement' : isEditing ? 'Edit Announcement' : 'Create Announcement'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="announcement-form">
          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter announcement title"
              required
              disabled={viewOnly}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="6"
              placeholder="Enter announcement content"
              required
              disabled={viewOnly}
            />
            {errors.content && <span className="error-text">{errors.content}</span>}
          </div>

          <div className="form-group">
            <label>Recipients *</label>
            <div className="recipients-checkboxes">
              {recipientOptions.map(option => (
                <label key={option.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.recipients.includes(option.id)}
                    onChange={() => handleRecipientChange(option.id)}
                    disabled={viewOnly}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors.recipients && <span className="error-text">{errors.recipients}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={viewOnly}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="scheduled_time">Scheduled Time</label>
              <input
                type="datetime-local"
                id="scheduled_time"
                name="scheduled_time"
                value={formData.scheduled_time}
                onChange={handleChange}
                disabled={formData.status !== 'Scheduled' || viewOnly}
              />
              {errors.scheduled_time && <span className="error-text">{errors.scheduled_time}</span>}
            </div>
          </div>

          {!viewOnly && (
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AnnouncementForm;
