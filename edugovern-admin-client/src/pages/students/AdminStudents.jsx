import { useState, useEffect } from 'react';
import './AdminStudents.css';
import Sidebar from '../../components/layout/Sidebar';
import StudentForm from '../../components/students/StudentForm';
import { createStudent, getAllStudents, updateStudent, getStudentById } from '../../services/student.service.js';
import { getClasses, getSections } from '../../services/academic.service.js';
import { normalizeClassForCompare } from '../../utils/classCompare.js';

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
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [allSections, setAllSections] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    getClasses().then((data) => setClasses(Array.isArray(data) ? data : [])).catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    getSections().then((data) => setAllSections(Array.isArray(data) ? data : [])).catch(() => setAllSections([]));
  }, []);

  // Default to LKG when classes load and no class is selected yet
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      const lkgClass = classes.find((c) => normalizeClassForCompare(c.name) === 'lkg');
      if (lkgClass) setSelectedClass(lkgClass.name);
    }
  }, [classes]);

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

  // Filter students by class (and optional section), then sort by section order
  useEffect(() => {
    if (!selectedClass) {
      setFilteredStudents([]);
      return;
    }

    // Match class by normalized value so "10th" (in DB) matches "10" (from Academic Setup dropdown)
    const selectedClassNorm = normalizeClassForCompare(selectedClass);
    let filtered = students.filter(student => normalizeClassForCompare(student.class) === selectedClassNorm);

    if (selectedSection) {
      filtered = filtered.filter(student => student.section === selectedSection);
    }

    // Apply search filter if search term exists
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone?.includes(searchTerm) ||
        student.primary_contact?.includes(searchTerm)
      );
    }

    const sectionNames = [...new Set(sections.map((s) => s.name))];
    filtered = [...filtered].sort((a, b) => {
      const secA = (a.section || '').toString().toUpperCase();
      const secB = (b.section || '').toString().toUpperCase();
      const idxA = sectionNames.indexOf(secA);
      const idxB = sectionNames.indexOf(secB);
      if (idxA === -1 && idxB === -1) return (secA || '').localeCompare(secB || '');
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    setFilteredStudents(filtered);
  }, [students, searchTerm, selectedClass, selectedSection, sections]);

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

  const classOrder = classes.map((c) => c.name);

  const handlePromoteStudent = async (id) => {
    try {
      const student = await getStudentById(id);
      const currentClass = student.class;
      const currentIndex = classOrder.findIndex((c) => normalizeClassForCompare(c) === normalizeClassForCompare(currentClass));
      
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
    if (!selectedClass || !selectedSection) {
      setError('Please select both Class and Section to promote students.');
      return;
    }

    if (filteredStudents.length === 0) {
      setError(`No students found in ${selectedClass} - ${selectedSection} to promote.`);
      return;
    }

    const currentIndex = classOrder.findIndex((c) => normalizeClassForCompare(c) === normalizeClassForCompare(selectedClass));
    
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
                disabled={!selectedClass}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <section className="students-table-section">
            {loading ? (
              <div className="loading-message">Loading students...</div>
            ) : !selectedClass ? (
              <div className="students-table-placeholder">
                <p className="placeholder-message">
                  Please select <strong>Class</strong> to view student details (listed in section order).
                </p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="students-table-placeholder">
                <p className="placeholder-message">
                  {searchTerm
                    ? `No students found matching "${searchTerm}" in ${selectedClass}${selectedSection ? ` - ${selectedSection}` : ''}.`
                    : `No students found in ${selectedClass}${selectedSection ? ` - ${selectedSection}` : ''}. Click "Add Student" to add a new student.`
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
              classes={classes}
              sections={allSections}
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


