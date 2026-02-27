import { useState, useEffect } from 'react';
import './AdminFaculty.css';
import Sidebar from '../../components/layout/Sidebar';
import FacultyForm from '../../components/faculty/FacultyForm';
import {
  getAllFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty
} from '../../services/faculty.service.js';
import { getClasses, getSections } from '../../services/academic.service.js';
import { normalizeClassForCompare } from '../../utils/classCompare.js';

/* Admin Faculty Page */
const AdminFaculty = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [deleteConfirmFaculty, setDeleteConfirmFaculty] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [allSections, setAllSections] = useState([]);

  useEffect(() => {
    fetchFaculty();
  }, []);

  useEffect(() => {
    getClasses().then((data) => setClasses(Array.isArray(data) ? data : [])).catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    getSections().then((data) => setAllSections(Array.isArray(data) ? data : [])).catch(() => setAllSections([]));
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      return;
    }
    const classId = classes.find((c) => normalizeClassForCompare(c.name) === normalizeClassForCompare(selectedClass))?.id;
    if (!classId) {
      setSections([]);
      return;
    }
    getSections(classId).then((data) => setSections(Array.isArray(data) ? data : [])).catch(() => setSections([]));
  }, [selectedClass, classes]);

  // Filter faculty: when class selected, show faculty for that class; section narrows further
  useEffect(() => {
    let filtered = [...faculty];

    if (selectedClass) {
      const selectedClassNorm = normalizeClassForCompare(selectedClass);
      filtered = filtered.filter(f =>
        normalizeClassForCompare(f.class) === selectedClassNorm && (!selectedSection || f.section === selectedSection)
      );
    }

    // Apply search filter if search term exists
    if (searchTerm) {
      filtered = filtered.filter(f =>
        (f.staff_name || f.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.contact?.includes(searchTerm)
      );
    }

    setFilteredFaculty(filtered);
  }, [faculty, searchTerm, selectedClass, selectedSection]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const data = await getAllFaculty();
      setFaculty(data);
      setFilteredFaculty(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaculty = () => {
    setEditingFaculty(null);
    setShowForm(true);
  };

  const handleViewFaculty = (facultyMember) => {
    setError('');
    setEditingFaculty({ ...facultyMember, viewOnly: true });
    setShowForm(true);
  };

  const handleEditFaculty = (facultyMember) => {
    setError('');
    setEditingFaculty({ ...facultyMember });
    setShowForm(true);
  };

  const handleRemoveClick = (facultyMember) => {
    const staffId = facultyMember?.staff_id;
    if (!staffId || (typeof staffId === 'string' && !staffId.trim())) {
      setError('Cannot delete: invalid faculty data');
      return;
    }
    setError('');
    setDeleteConfirmFaculty(facultyMember);
  };

  const handleDeleteConfirmClose = () => {
    if (!deleting) setDeleteConfirmFaculty(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmFaculty) return;
    const staffId = deleteConfirmFaculty?.staff_id;
    if (!staffId || (typeof staffId === 'string' && !staffId.trim())) return;

    setDeleting(true);
    try {
      await deleteFaculty(staffId);
      setDeleteConfirmFaculty(null);
      await fetchFaculty();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete faculty');
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFaculty(null);
  };

  const handleSubmitForm = async (facultyData) => {
    try {
      if (editingFaculty && !editingFaculty.viewOnly) {
        if (!editingFaculty.staff_id) throw new Error('Invalid faculty: missing staff_id');
        await updateFaculty(editingFaculty.staff_id, facultyData);
      } else {
        await createFaculty(facultyData);
      }
      setShowForm(false);
      setEditingFaculty(null);
      await fetchFaculty();
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className='faculty-container'>
      <Sidebar />
      <div className="faculty-page">
        <header className="faculty-header">
          <h1>Faculty Details</h1>
        </header>

        <main className="faculty-content">
          <div className="faculty-filters">
            <div className="filter-buttons">
              <select 
                className="filter-btn"
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); }}
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <select 
                className="filter-btn"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="">Select Section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="search-promote-section">
              <div className="promote-add-buttons">
                <button className="add-faculty-btn" onClick={handleAddFaculty}>Add Faculty</button>
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

          <section className="faculty-table-section">
            {loading ? (
              <div className="loading-message">Loading faculty...</div>
            ) : filteredFaculty.length === 0 ? (
              <div className="faculty-table-placeholder">
                <p className="placeholder-message">
                  {searchTerm
                    ? `No faculty found matching "${searchTerm}"${selectedClass ? ` in ${selectedClass}${selectedSection ? ` - ${selectedSection}` : ''}` : ''}.`
                    : selectedClass
                      ? `No faculty found in ${selectedClass}${selectedSection ? ` - ${selectedSection}` : ''}. Click "Add Faculty" to add a new faculty member.`
                      : 'No faculty records yet. Click "Add Faculty" to add a new faculty member.'
                  }
                </p>
              </div>
            ) : (
              <div className="faculty-table">
                <table>
                  <thead>
                    <tr>
                      <th>S.no</th>
                      <th>Staff ID</th>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFaculty.map((facultyMember, index) => (
                      <tr key={facultyMember.staff_id ?? index}>
                        <td>{(index + 1).toString().padStart(2, '0')}</td>
                        <td>{facultyMember.staff_id || '-'}</td>
                        <td>{facultyMember.staff_name || facultyMember.name || '-'}</td>
                        <td>{facultyMember.designation || '-'}</td>
                        <td>{facultyMember.class || '-'}</td>
                        <td>{facultyMember.section || '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-btn view-btn"
                              onClick={() => handleViewFaculty(facultyMember)}
                            >
                              View
                            </button>
                            <button 
                              className="action-btn update-btn"
                              onClick={() => handleEditFaculty(facultyMember)}
                            >
                              Update
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleRemoveClick(facultyMember)}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {showForm && (
        <FacultyForm
          key={editingFaculty ? `faculty-${editingFaculty.staff_id}-${editingFaculty.viewOnly ? 'view' : 'edit'}` : 'faculty-add'}
          faculty={editingFaculty}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isEditing={!!editingFaculty && !editingFaculty?.viewOnly}
          viewOnly={!!editingFaculty?.viewOnly}
          classes={classes}
          sections={allSections}
        />
      )}

      {deleteConfirmFaculty && (
        <div className="delete-confirm-overlay" onClick={handleDeleteConfirmClose}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="delete-confirm-title">Remove faculty member</h3>
            <p className="delete-confirm-message">
              Are you sure you want to remove{' '}
              <strong>{deleteConfirmFaculty.staff_name || deleteConfirmFaculty.name || 'this faculty member'}</strong>?
              This action cannot be undone.
            </p>
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-cancel"
                onClick={handleDeleteConfirmClose}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-submit"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Removing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFaculty;
