import { useState, useEffect } from 'react';
import './AdminFaculty.css';
import Sidebar from '../../components/layout/Sidebar';
import FacultyForm from '../../components/faculty/FacultyForm';
import {
  getAllFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getFacultyById
} from '../../services/faculty.service.js';

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

  // Fetch faculty on component mount
  useEffect(() => {
    fetchFaculty();
  }, []);

  // Filter faculty based on search, class, and section
  // Faculty will only show when both class and section are selected
  useEffect(() => {
    // Only filter if both class and section are selected
    if (!selectedClass || !selectedSection) {
      setFilteredFaculty([]);
      return;
    }

    let filtered = [...faculty];

    // First filter by class and section (both required)
    filtered = filtered.filter(f => 
      f.class === selectedClass && f.section === selectedSection
    );

    // Then apply search filter if search term exists
    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const handleViewFaculty = async (id) => {
    try {
      const facultyMember = await getFacultyById(id);
      setEditingFaculty({ ...facultyMember, viewOnly: true });
      setShowForm(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch faculty details');
    }
  };

  const handleEditFaculty = async (id) => {
    try {
      const facultyMember = await getFacultyById(id);
      setEditingFaculty(facultyMember);
      setShowForm(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch faculty details');
    }
  };

  const handleDeleteFaculty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) {
      return;
    }

    try {
      await deleteFaculty(id);
      await fetchFaculty();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete faculty');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFaculty(null);
  };

  const handleSubmitForm = async (facultyData) => {
    try {
      if (editingFaculty && !editingFaculty.viewOnly) {
        await updateFaculty(editingFaculty.id, facultyData);
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
                onChange={(e) => setSelectedClass(e.target.value)}
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
              <select 
                className="filter-btn"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="">Select Section</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
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
                disabled={!selectedClass || !selectedSection}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <section className="faculty-table-section">
            {loading ? (
              <div className="loading-message">Loading faculty...</div>
            ) : !selectedClass || !selectedSection ? (
              <div className="faculty-table-placeholder">
                <p className="placeholder-message">
                  Please select both <strong>Class</strong> and <strong>Section</strong> to view faculty details.
                </p>
              </div>
            ) : filteredFaculty.length === 0 ? (
              <div className="faculty-table-placeholder">
                <p className="placeholder-message">
                  {searchTerm 
                    ? `No faculty found matching "${searchTerm}" in ${selectedClass} - ${selectedSection}.`
                    : `No faculty found in ${selectedClass} - ${selectedSection}. Click "Add Faculty" to add a new faculty member.`
                  }
                </p>
              </div>
            ) : (
              <div className="faculty-table">
                <table>
                  <thead>
                    <tr>
                      <th>S.no</th>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFaculty.map((facultyMember, index) => (
                      <tr key={facultyMember.id}>
                        <td>{(index + 1).toString().padStart(2, '0')}</td>
                        <td>{facultyMember.name || '-'}</td>
                        <td>{facultyMember.designation || '-'}</td>
                        <td>{facultyMember.class || '-'}</td>
                        <td>{facultyMember.section || '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-btn view-btn"
                              onClick={() => handleViewFaculty(facultyMember.id)}
                            >
                              View
                            </button>
                            <button 
                              className="action-btn update-btn"
                              onClick={() => handleEditFaculty(facultyMember.id)}
                            >
                              Update
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteFaculty(facultyMember.id)}
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
          faculty={editingFaculty}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isEditing={!!editingFaculty && !editingFaculty?.viewOnly}
          viewOnly={editingFaculty?.viewOnly || false}
        />
      )}
    </div>
  );
};

export default AdminFaculty;
