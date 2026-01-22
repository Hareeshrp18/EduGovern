import { useState, useEffect } from 'react';
import './AdminStudents.css';
import Sidebar from '../../components/layout/Sidebar';
import StudentForm from '../../components/students/StudentForm';
import { createStudent, getAllStudents, updateStudent, getStudentById } from '../../services/student.service.js';

/* Admin Students Page */
const AdminStudents = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [promoteData, setPromoteData] = useState(null);

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students based on search, class, and section
  // Students will only show when both class and section are selected
  useEffect(() => {
    // Only filter if both class and section are selected
    if (!selectedClass || !selectedSection) {
      setFilteredStudents([]);
      return;
    }

    let filtered = [...students];

    // First filter by class and section (both required)
    filtered = filtered.filter(student => 
      student.class === selectedClass && student.section === selectedSection
    );

    // Then apply search filter if search term exists
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone?.includes(searchTerm) ||
        student.primary_contact?.includes(searchTerm)
      );
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, selectedClass, selectedSection]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await getAllStudents();
      setStudents(data);
      setFilteredStudents(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setShowForm(true);
  };

  const handleViewStudent = async (id) => {
    try {
      const student = await getStudentById(id);
      setEditingStudent({ ...student, viewOnly: true });
      setShowForm(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch student details');
    }
  };

  const handleUpdateStudent = async (id) => {
    try {
      const student = await getStudentById(id);
      setEditingStudent(student);
      setShowForm(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch student details');
    }
  };

  const handlePromoteStudent = async (id) => {
    try {
      const student = await getStudentById(id);
      const currentClass = student.class;
      const classOrder = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
      const currentIndex = classOrder.indexOf(currentClass);
      
      if (currentIndex === -1 || currentIndex === classOrder.length - 1) {
        setError('Cannot promote student. Already in highest class or invalid class.');
        return;
      }

      const nextClass = classOrder[currentIndex + 1];
      
      // Show confirmation modal
      setPromoteData({
        type: 'single',
        studentName: student.name || 'this student',
        currentClass: currentClass,
        nextClass: nextClass,
        section: student.section || '',
        studentId: id,
        student: student
      });
      setShowPromoteConfirm(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch student details');
    }
  };

  const confirmPromoteSingle = async () => {
    if (!promoteData || promoteData.type !== 'single') return;

    try {
      setLoading(true);
      setError('');
      setShowPromoteConfirm(false);

      await updateStudent(promoteData.studentId, { ...promoteData.student, class: promoteData.nextClass });
      await fetchStudents();
      setError('');
      setPromoteData(null);
    } catch (err) {
      setError(err.message || 'Failed to promote student');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPromote = () => {
    setShowPromoteConfirm(false);
    setPromoteData(null);
  };

  const handlePromoteAllStudents = () => {
    // Check if both class and section are selected
    if (!selectedClass || !selectedSection) {
      setError('Please select both Class and Section to promote students.');
      return;
    }

    // Check if there are students to promote
    if (filteredStudents.length === 0) {
      setError(`No students found in ${selectedClass} - ${selectedSection} to promote.`);
      return;
    }

    // Get the next class
    const classOrder = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
    const currentIndex = classOrder.indexOf(selectedClass);
    
    if (currentIndex === -1) {
      setError('Invalid class selected. Cannot promote students.');
      return;
    }

    if (currentIndex === classOrder.length - 1) {
      setError(`Students in ${selectedClass} are already in the highest class. Cannot promote further.`);
      return;
    }

    const nextClass = classOrder[currentIndex + 1];

    // Show confirmation modal
    setPromoteData({
      type: 'all',
      studentCount: filteredStudents.length,
      currentClass: selectedClass,
      nextClass: nextClass,
      section: selectedSection,
      students: filteredStudents
    });
    setShowPromoteConfirm(true);
  };

  const confirmPromoteAll = async () => {
    if (!promoteData) return;

    try {
      setLoading(true);
      setError('');
      setShowPromoteConfirm(false);

      // Promote all students in the filtered list
      const promotePromises = promoteData.students.map(async (student) => {
        try {
          await updateStudent(student.id, { ...student, class: promoteData.nextClass });
        } catch (err) {
          console.error(`Failed to promote student ${student.id}:`, err);
          throw err;
        }
      });

      await Promise.all(promotePromises);
      
      // Refresh the student list
      await fetchStudents();
      
      // Update the selected class to the new class to show promoted students
      setSelectedClass(promoteData.nextClass);
      
      setError('');
      setPromoteData(null);
    } catch (err) {
      setError(err.message || 'Failed to promote some students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingStudent(null);
  };

  const handleSubmitForm = async (studentData) => {
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, studentData);
      } else {
      await createStudent(studentData);
      }
      setShowForm(false);
      setEditingStudent(null);
      // Refresh students list
      await fetchStudents();
    } catch (err) {
      throw err; // Re-throw to let form handle the error
    }
  };

  return (
    <div className='students-container'>
      <Sidebar />
      <div className="students-page">
        <header className="students-header">
          <h1>Student Details</h1>
        </header>

        <main className="students-content">
          <div className="students-filters">
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
                <button 
                  className="promote-btn" 
                  onClick={handlePromoteAllStudents}
                  disabled={!selectedClass || !selectedSection || loading || filteredStudents.length === 0}
                >
                  Promote
            </button>
                <button className="add-student-btn" onClick={handleAddStudent}>Add Student</button>
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

          <section className="students-table-section">
            {loading ? (
              <div className="loading-message">Loading students...</div>
            ) : !selectedClass || !selectedSection ? (
              <div className="students-table-placeholder">
                <p className="placeholder-message">
                  Please select both <strong>Class</strong> and <strong>Section</strong> to view student details.
                </p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="students-table-placeholder">
                <p className="placeholder-message">
                  {searchTerm 
                    ? `No students found matching "${searchTerm}" in ${selectedClass} - ${selectedSection}.`
                    : `No students found in ${selectedClass} - ${selectedSection}. Click "Add Student" to add a new student.`
                  }
                </p>
              </div>
            ) : (
              <div className="students-table">
                <table>
                  <thead>
                    <tr>
                      <th>S.no</th>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Phone no</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id}>
                        <td>{(index + 1).toString().padStart(2, '0')}</td>
                        <td>{student.name || '-'}</td>
                        <td>{student.class || '-'}</td>
                        <td>{student.section || '-'}</td>
                        <td>{student.phone || student.primary_contact || '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-btn view-btn"
                              onClick={() => handleViewStudent(student.id)}
                            >
                              View
                            </button>
                            <button 
                              className="action-btn update-btn"
                              onClick={() => handleUpdateStudent(student.id)}
                            >
                              Update
                            </button>
                            <button 
                              className="action-btn promote-btn-action"
                              onClick={() => handlePromoteStudent(student.id)}
                            >
                              Promote
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
        <StudentForm
          student={editingStudent}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isEditing={!!editingStudent && !editingStudent?.viewOnly}
          viewOnly={editingStudent?.viewOnly || false}
        />
      )}

      {/* Promotion Confirmation Modal */}
      {showPromoteConfirm && promoteData && (
        <div className="promote-confirm-overlay" onClick={handleCancelPromote}>
          <div className="promote-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="promote-confirm-header">
              <h3>Confirm Promotion</h3>
              <button className="close-btn" onClick={handleCancelPromote}>×</button>
            </div>
            <div className="promote-confirm-body">
              {promoteData.type === 'all' ? (
                <p>
                  Are you sure you want to promote all <strong>{promoteData.studentCount}</strong> student(s) from{' '}
                  <strong>{promoteData.currentClass} - {promoteData.section}</strong> to{' '}
                  <strong>{promoteData.nextClass} - {promoteData.section}</strong>?
                </p>
              ) : (
                <p>
                  Are you sure you want to promote <strong>{promoteData.studentName}</strong> from{' '}
                  <strong>{promoteData.currentClass}</strong> to <strong>{promoteData.nextClass}</strong>?
                </p>
              )}
            </div>
            <div className="promote-confirm-actions">
              <button className="promote-cancel-btn" onClick={handleCancelPromote}>
                Cancel
              </button>
              <button 
                className="promote-confirm-btn" 
                onClick={promoteData.type === 'all' ? confirmPromoteAll : confirmPromoteSingle}
                disabled={loading}
              >
                {loading ? 'Promoting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;


