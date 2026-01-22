import { useState, useEffect } from 'react';
import './StudentForm.css';

/**
 * Student Form Component
 * Used for both adding and editing students
 * Matches the design with photo upload, two-column layout, and appropriate input/select fields
 */
const StudentForm = ({ student, onClose, onSubmit, isEditing = false, viewOnly = false }) => {
  const [formData, setFormData] = useState({
    student_id: '',
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
  const [photoPreview, setPhotoPreview] = useState(null);

  // Populate form if editing or viewing
  useEffect(() => {
    if (student && (isEditing || viewOnly)) {
      setFormData({
        student_id: student.student_id || '',
        name: student.name || '',
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        class: student.class || '',
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
  }, [student, isEditing, viewOnly]);

  // Auto-generate student_id when form opens (for new students)
  useEffect(() => {
    if (!isEditing && !formData.student_id) {
      // Generate student ID: STU + timestamp + random 4 digits
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({
        ...prev,
        student_id: `STU${timestamp}${random}`
      }));
    }
  }, [isEditing]);

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

    if (!formData.student_id.trim()) {
      newErrors.student_id = 'Student ID is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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
      // In production, upload photo file to server and get URL
      // For now, we'll just send the data
      if (photoPreview && formData.photoFile) {
        // In production: upload file and get URL
        submitData.photo = photoPreview; // Temporary, should be server URL
      }
      await onSubmit(submitData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
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

          {/* Student ID Field (Auto-generated, can be edited) */}
          {!isEditing && (
            <div className="form-group student-id-field">
              <label htmlFor="student_id">Student ID *</label>
              <input
                type="text"
                id="student_id"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                placeholder="Auto-generated"
                required
                disabled={viewOnly}
              />
              {errors.student_id && <span className="error-text">{errors.student_id}</span>}
            </div>
          )}

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
                <label htmlFor="class">Class</label>
                <select
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="">Select Class</option>
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="3rd">3rd</option>
                  <option value="4th">4th</option>
                  <option value="5th">5th</option>
                  <option value="6th">6th</option>
                  <option value="7th">7th</option>
                  <option value="8th">8th</option>
                  <option value="9th">9th</option>
                  <option value="10th">10th</option>
                  <option value="11th">11th</option>
                  <option value="12th">12th</option>
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
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
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
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
