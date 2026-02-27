import { useState, useEffect } from 'react';
import './FacultyForm.css';
import { normalizeClassForCompare } from '../../utils/classCompare.js';

/**
 * Faculty Form Component
 * Used for both adding and editing faculty
 */
const formatDateForInput = (d) => {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return '';
};

const emptyFormData = {
  staff_name: '',
  date_of_birth: '',
  designation: '',
  experience: '',
  contact: '',
  email: '',
  address: '',
  salary: '',
  class: '',
  section: '',
  qualification: '',
  joining_date: '',
  status: 'Active'
};

const facultyToFormData = (f) => {
  if (!f) return emptyFormData;
  return {
    staff_name: f.staff_name || f.name || '',
    date_of_birth: formatDateForInput(f.date_of_birth),
    designation: f.designation || '',
    experience: f.experience != null ? String(f.experience) : '',
    contact: f.contact || '',
    email: f.email || '',
    address: f.address || '',
    salary: f.salary != null ? String(f.salary) : '',
    class: f.class || '',
    section: f.section || '',
    qualification: f.qualification || '',
    joining_date: formatDateForInput(f.joining_date),
    status: f.status || 'Active'
  };
};

const FacultyForm = ({ faculty, onClose, onSubmit, isEditing = false, viewOnly = false, classes = [], sections = [] }) => {
  const isViewOrEdit = !!(isEditing || viewOnly);
  const initialData = isViewOrEdit && faculty ? facultyToFormData(faculty) : emptyFormData;
  const initialPhoto = (isViewOrEdit && faculty && faculty.photo) ? faculty.photo : null;

  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(initialPhoto);

  const sectionOptions = sections.filter((s) =>
    normalizeClassForCompare(s.class_name || '') === normalizeClassForCompare(formData.class)
  );

  // Keep form in sync when faculty prop changes; resolve class so "10th" matches dropdown "10"
  useEffect(() => {
    if (!faculty || !isViewOrEdit) return;
    const data = facultyToFormData(faculty);
    const facultyClass = data.class || '';
    const resolvedClass = classes.length && facultyClass
      ? (classes.find(c => normalizeClassForCompare(c.name) === normalizeClassForCompare(facultyClass))?.name ?? facultyClass)
      : facultyClass;
    setFormData({ ...data, class: resolvedClass });
    setPhotoPreview(faculty.photo || null);
    setErrors({});
  }, [faculty, isEditing, viewOnly, classes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'class') next.section = '';
      return next;
    });
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, just show preview. In production, upload to server
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Store file for submission
      setFormData(prev => ({ ...prev, photoFile: file }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.staff_name.trim()) {
      newErrors.staff_name = 'Name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
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
      // Build payload: ensure staff_name is sent, omit photoFile (not JSON-serializable)
      const { photoFile, ...rest } = formData;
      const submitData = {
        ...rest,
        staff_name: (formData.staff_name || '').trim()
      };
      if (photoPreview && photoFile) {
        submitData.photo = photoPreview;
      } else if (photoPreview && !photoFile) {
        submitData.photo = photoPreview;
      }
      await onSubmit(submitData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="faculty-form-overlay" onClick={onClose}>
      <div className="faculty-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="faculty-form-header">
          <h2>{viewOnly ? 'View Faculty Details' : isEditing ? 'Edit Faculty' : 'Add Faculty'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="faculty-form">
          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <div className="photo-upload-section">
            <div className="photo-upload-area">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
                disabled={viewOnly}
              />
              <label 
                htmlFor="photo-upload" 
                className="photo-upload-label"
                style={{ cursor: viewOnly ? 'default' : 'pointer', pointerEvents: viewOnly ? 'none' : 'auto' }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Faculty" className="photo-preview" />
                ) : (
                  <div className="photo-placeholder">
                    <span className="photo-icon">+</span>
                  </div>
                )}
              </label>
              <span className="photo-label-text">Photo</span>
            </div>
          </div>

          <div className="form-columns">
            {/* Left Column */}
            <div className="form-column-left">
              <div className="form-group">
                <label htmlFor="staff_name">Name *</label>
                <input
                  type="text"
                  id="staff_name"
                  name="staff_name"
                  value={formData.staff_name}
                  onChange={handleChange}
                  required
                  disabled={viewOnly}
                />
                {errors.staff_name && <span className="error-text">{errors.staff_name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="date_of_birth">Date of Birth</label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  disabled={viewOnly}
                />
              </div>

              <div className="form-group">
                <label htmlFor="designation">Designation</label>
                <select
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="">Select Designation</option>
                  <option value="Principal">Principal</option>
                  <option value="Vice Principal">Vice Principal</option>
                  <option value="Head Teacher">Head Teacher</option>
                  <option value="Senior Teacher">Senior Teacher</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Assistant Teacher">Assistant Teacher</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Lab Assistant">Lab Assistant</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="experience">Experience (Years)</label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                  disabled={viewOnly}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact">Contact</label>
                <input
                  type="tel"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="10 digit mobile number"
                  disabled={viewOnly}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={viewOnly}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column-right">
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter full address"
                  disabled={viewOnly}
                />
              </div>

              <div className="form-group">
                <label htmlFor="salary">Salary</label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Enter salary"
                  min="0"
                  step="0.01"
                  disabled={viewOnly}
                />
              </div>

              <div className="form-group">
                <label htmlFor="class">Class</label>
                <select
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="section">Section</label>
                <select
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="">Select Section</option>
                  {sectionOptions.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="qualification">Qualification</label>
                <input
                  type="text"
                  id="qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="e.g., B.Ed, M.A, Ph.D"
                  disabled={viewOnly}
                />
              </div>

              <div className="form-group">
                <label htmlFor="joining_date">Joining Date</label>
                <input
                  type="date"
                  id="joining_date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleChange}
                  disabled={viewOnly}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>
          </div>

          {!viewOnly && (
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Update' : 'Add'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FacultyForm;
