import { useState, useEffect } from 'react';
import './StudentForm.css';
import { uploadFile } from '../../services/upload.service.js';
import { normalizeClassForCompare } from '../../utils/classCompare.js';


const StudentForm = ({ student, onClose, onSubmit, isEditing = false, viewOnly = false, classes = [], sections = [] }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    roll_no: '',
    name: '',
    date_of_birth: '',
    gender: '',
    class: '',
    section: '',
    blood_group: '',
    father_name: '',
    mother_name: '',
    primary_contact: '',
    secondary_contact: '',
    address: '',
    aadhar_no: '',
    annual_income: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  useEffect(() => {
    if (student && (isEditing || viewOnly)) {
      const studentClass = student.class || '';
      const resolvedClass = classes.length && studentClass
        ? (classes.find(c => normalizeClassForCompare(c.name) === normalizeClassForCompare(studentClass))?.name ?? studentClass)
        : studentClass;
      
      // Format date_of_birth - backend now sends yyyy-MM-dd format
      let formattedDob = student.date_of_birth || '';
      if (formattedDob) {
        // Backend now sends dates in yyyy-MM-dd format, use directly
        if (typeof formattedDob === 'string' && formattedDob.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Already in correct format
          formattedDob = formattedDob;
        } else if (formattedDob instanceof Date) {
          // If somehow still a Date object, format it properly
          const year = formattedDob.getFullYear();
          const month = String(formattedDob.getMonth() + 1).padStart(2, '0');
          const day = String(formattedDob.getDate()).padStart(2, '0');
          formattedDob = `${year}-${month}-${day}`;
        } else {
          // Handle ISO date strings by extracting just the date part
          const isoMatch = String(formattedDob).match(/^(\d{4}-\d{2}-\d{2})/);
          if (isoMatch) {
            formattedDob = isoMatch[1];
          }
        }
      }
      
      setFormData({
        student_id: student.student_id || '',
        roll_no: student.roll_no || '',
        name: student.name || '',
        date_of_birth: formattedDob,
        gender: student.gender || '',
        class: resolvedClass,
        section: student.section || '',
        blood_group: student.blood_group || '',
        father_name: student.father_name || '',
        mother_name: student.mother_name || '',
        primary_contact: student.primary_contact || '',
        secondary_contact: student.secondary_contact || '',
        address: student.address || '',
        aadhar_no: student.aadhar_no || '',
        annual_income: student.annual_income || '',
        status: student.status || 'Active'
      });
      if (student.photo) {
        setPhotoPreview(student.photo);
      }
    }
  }, [student, isEditing, viewOnly, classes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev };
      
      // Handle date fields - keep in yyyy-MM-dd format without timezone conversion
      if (name === 'date_of_birth' && value) {
        // The HTML date input already provides yyyy-MM-dd format
        // No need for timezone conversion - use the value directly
        next[name] = value;
      } else {
        next[name] = value;
      }
      
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

  const sectionOptions = sections.filter(s =>
    normalizeClassForCompare(s.class_name || '') === normalizeClassForCompare(formData.class)
  );

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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.class) {
      newErrors.class = 'Class is required';
    }

    if (isEditing && !formData.student_id.trim()) {
      newErrors.student_id = 'Student ID is required when updating';
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
      const submitData = { ...formData };

      // If a new photo file is selected, upload it first
      if (photoPreview && formData.photoFile) {
        setUploadingPhoto(true);
        try {
          const uploadResult = await uploadFile(formData.photoFile, 'students');
          submitData.photo = uploadResult.url;
        } catch (err) {
          setErrors({ submit: err.message || 'Failed to upload photo' });
          return;
        } finally {
          setUploadingPhoto(false);
        }
      } else if (photoPreview && !formData.photoFile) {
        // No new file selected but a preview exists (editing existing photo)
        submitData.photo = photoPreview;
      }

      await onSubmit(submitData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="student-form-overlay" onClick={onClose}>
      <div className="student-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="student-form-header">
          <h2>{viewOnly ? 'View Student Details' : 'Student Details'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="student-form">
          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          {/* Student ID Field - Editable with validation */}
          <div className="form-group student-id-field">
            <label htmlFor="student_id">Student ID {isEditing && '*'}</label>
            <input
              type="text"
              id="student_id"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              placeholder={isEditing ? "e.g., 1@sks, 2@sks" : "Auto-generated on save"}
              required={isEditing}
              disabled={viewOnly}
              readOnly={!isEditing}
            />
            {errors.student_id && <span className="error-text">{errors.student_id}</span>}
            <small style={{ color: '#666', fontSize: '12px' }}>
              {isEditing 
                ? 'Editable - Format: number@sks (e.g., 1@sks, 2@sks). Changes will update all related records.' 
                : 'Will be auto-generated when you save'}
            </small>
          </div>

          {/* Roll Number Field - Always editable except in view mode */}
          <div className="form-group roll-no-field">
            <label htmlFor="roll_no">Roll Number</label>
            <input
              type="text"
              id="roll_no"
              name="roll_no"
              value={formData.roll_no}
              onChange={handleChange}
              placeholder={isEditing ? "e.g., STUD101@sks" : "Auto-generated or enter manually"}
              disabled={viewOnly}
            />
            {errors.roll_no && <span className="error-text">{errors.roll_no}</span>}
            <small style={{ color: '#666', fontSize: '12px' }}>
              {isEditing ? 'Editable - Format: STUD{class}{rollno}@sks' : 'Optional - Will auto-generate if left empty'}
            </small>
          </div>

          {/* Photo Upload Section */}
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
                  <img src={photoPreview} alt="Student" className="photo-preview" />
                ) : (
                  <div className="photo-placeholder">
                    <span className="photo-icon">+</span>
                  </div>
                )}
              </label>
              <span className="photo-label-text">Photo</span>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="form-columns">
            {/* Left Column */}
            <div className="form-column-left">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={viewOnly}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="class">Class *</label>
                <select
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  required
                  disabled={viewOnly}
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.class && <span className="error-text">{errors.class}</span>}
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
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="blood_group">Blood Group</label>
                <select
                  id="blood_group"
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column-right">
              <div className="form-group">
                <label htmlFor="father_name">Father's Name</label>
                <input
                  type="text"
                  id="father_name"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleChange}
                  disabled={viewOnly}
                />
              </div>

              <div className="form-group">
                <label htmlFor="mother_name">Mother's Name</label>
                <input
                  type="text"
                  id="mother_name"
                  name="mother_name"
                  value={formData.mother_name}
                  onChange={handleChange}
                  disabled={viewOnly}
                />
              </div>

              <div className="form-group">
                <label htmlFor="primary_contact">Primary contact</label>
                <input
                  type="tel"
                  id="primary_contact"
                  name="primary_contact"
                  value={formData.primary_contact}
                  onChange={handleChange}
                  placeholder="10 digit mobile number"
                  disabled={viewOnly}
                />
              </div>

              <div className="form-group">
                <label htmlFor="secondary_contact">Secondary contact</label>
                <input
                  type="tel"
                  id="secondary_contact"
                  name="secondary_contact"
                  value={formData.secondary_contact}
                  onChange={handleChange}
                  placeholder="10 digit mobile number"
                  disabled={viewOnly}
                />
              </div>

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
                <label htmlFor="aadhar_no">Aadhar No</label>
                <input
                  type="text"
                  id="aadhar_no"
                  name="aadhar_no"
                  value={formData.aadhar_no}
                  onChange={handleChange}
                  placeholder="12 digit Aadhar number"
                  maxLength="12"
                  disabled={viewOnly}
                />
              </div>

              <div className="form-group">
                <label htmlFor="annual_income">Annual Income</label>
                <input
                  type="number"
                  id="annual_income"
                  name="annual_income"
                  value={formData.annual_income}
                  onChange={handleChange}
                  placeholder="Enter annual income"
                  min="0"
                  step="0.01"
                  disabled={viewOnly}
                />
              </div>
            </div>
          </div>


          {/* Action Buttons - Hidden in view-only mode */}
          {!viewOnly && (
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading || uploadingPhoto}>
              {uploadingPhoto ? 'Uploading Photo...' : loading ? 'Saving...' : 'Save'}
            </button>
          </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
