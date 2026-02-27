import { useState, useEffect, useMemo } from 'react';
import './AdminAcademicSetup.css';
import Sidebar from '../../components/layout/Sidebar';
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getExams,
  createExam,
  updateExam,
  deleteExam
} from '../../services/academic.service.js';

const TABS = { CLASSES: 'classes', SECTIONS: 'sections', SUBJECTS: 'subjects', EXAMS: 'exams' };

const AdminAcademicSetup = () => {
  const [activeTab, setActiveTab] = useState(TABS.CLASSES);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ type: null, id: null, name: '' });

  // Form state
  const [classForm, setClassForm] = useState({ name: '' });
  const [sectionForm, setSectionForm] = useState({ name: '', class_id: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', class_id: '' });
  const [examForm, setExamForm] = useState({
    exam_type: '',
    class_id: '',
    subject_id: '',
    exam_date: '',
    max_marks: '100',
    description: ''
  });

  const fetchClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch classes');
    }
  };

  const fetchSections = async () => {
    try {
      const data = await getSections();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch sections');
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await getSubjects();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch subjects');
    }
  };

  const fetchExams = async () => {
    try {
      const data = await getExams();
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch exams');
    }
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([fetchClasses(), fetchSections(), fetchSubjects(), fetchExams()]).finally(() => setLoading(false));
  }, []);

  const showMsg = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  // ——— Classes ———
  const openAddClass = () => {
    setEditingClass(null);
    setClassForm({ name: '' });
    setShowClassModal(true);
  };

  const openEditClass = (row) => {
    setEditingClass(row);
    setClassForm({ name: row.name });
    setShowClassModal(true);
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    const name = classForm.name.trim();
    if (!name) return;
    const num = parseInt(name, 10);
    if (!Number.isNaN(num) && num > 12) {
      showMsg('Class cannot be above 12. Allowed: PreKG, LKG, UKG and 1 to 12.', true);
      return;
    }
    try {
      const payload = { name };
      if (editingClass) {
        await updateClass(editingClass.id, payload);
        showMsg('Class updated successfully');
      } else {
        await createClass(payload);
        showMsg('Class added successfully');
      }
      setShowClassModal(false);
      fetchClasses();
      fetchSubjects();
    } catch (err) {
      showMsg(err.message || 'Failed to save class', true);
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteClass(deleteConfirm.id);
      showMsg('Class removed successfully');
      setDeleteConfirm({ type: null, id: null, name: '' });
      fetchClasses();
      fetchSubjects();
    } catch (err) {
      showMsg(err.message || 'Failed to delete class', true);
    }
  };

  // ——— Sections ———
  const openAddSection = () => {
    setEditingSection(null);
    setSectionForm({
      name: '',
      class_id: classes.length ? String(classes[0].id) : ''
    });
    setShowSectionModal(true);
  };

  const openEditSection = (row) => {
    setEditingSection(row);
    setSectionForm({ name: row.name, class_id: String(row.class_id) });
    setShowSectionModal(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!sectionForm.name.trim() || !sectionForm.class_id) return;
    const payload = { name: sectionForm.name.trim(), class_id: Number(sectionForm.class_id) };
    try {
      if (editingSection) {
        await updateSection(editingSection.id, payload);
        showMsg('Section updated successfully');
      } else {
        await createSection(payload);
        showMsg('Section added successfully');
      }
      setShowSectionModal(false);
      fetchSections();
    } catch (err) {
      showMsg(err.message || 'Failed to save section', true);
    }
  };

  const handleDeleteSection = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteSection(deleteConfirm.id);
      showMsg('Section removed successfully');
      setDeleteConfirm({ type: null, id: null, name: '' });
      fetchSections();
    } catch (err) {
      showMsg(err.message || 'Failed to delete section', true);
    }
  };

  // ——— Subjects ———
  const openAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({
      name: '',
      class_id: classes.length ? String(classes[0].id) : ''
    });
    setShowSubjectModal(true);
  };

  const openEditSubject = (row) => {
    setEditingSubject(row);
    setSubjectForm({
      name: row.name,
      class_id: String(row.class_id)
    });
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.class_id) return;
    const payload = {
      name: subjectForm.name.trim(),
      class_id: Number(subjectForm.class_id)
    };
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, payload);
        showMsg('Subject updated successfully');
      } else {
        await createSubject(payload);
        showMsg('Subject added successfully');
      }
      setShowSubjectModal(false);
      fetchSubjects();
    } catch (err) {
      showMsg(err.message || 'Failed to save subject', true);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteSubject(deleteConfirm.id);
      showMsg('Subject removed successfully');
      setDeleteConfirm({ type: null, id: null, name: '' });
      fetchSubjects();
    } catch (err) {
      showMsg(err.message || 'Failed to delete subject', true);
    }
  };

  // ——— Exams ———
  const openAddExam = () => {
    setEditingExam(null);
    setExamForm({
      exam_type: '',
      class_id: classes.length ? String(classes[0].id) : '',
      subject_id: '',
      exam_date: '',
      max_marks: '100',
      description: ''
    });
    setShowExamModal(true);
  };

  const openEditExam = (row) => {
    setEditingExam(row);
    setExamForm({
      exam_type: row.exam_type || '',
      class_id: String(row.class_id),
      subject_id: row.subject_id ? String(row.subject_id) : '',
      exam_date: row.exam_date || '',
      max_marks: String(row.max_marks || '100'),
      description: row.description || ''
    });
    setShowExamModal(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!examForm.exam_type.trim() || !examForm.class_id) return;
    const payload = {
      exam_type: examForm.exam_type.trim(),
      class_id: Number(examForm.class_id),
      subject_id: examForm.subject_id ? Number(examForm.subject_id) : null,
      exam_date: examForm.exam_date || null,
      max_marks: parseFloat(examForm.max_marks) || 100,
      description: examForm.description.trim() || null
    };
    try {
      if (editingExam) {
        await updateExam(editingExam.id, payload);
        showMsg('Exam updated successfully');
      } else {
        await createExam(payload);
        showMsg('Exam added successfully');
      }
      setShowExamModal(false);
      fetchExams();
    } catch (err) {
      showMsg(err.message || 'Failed to save exam', true);
    }
  };

  const handleDeleteExam = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteExam(deleteConfirm.id);
      showMsg('Exam removed successfully');
      setDeleteConfirm({ type: null, id: null, name: '' });
      fetchExams();
    } catch (err) {
      showMsg(err.message || 'Failed to delete exam', true);
    }
  };

  const openDeleteConfirm = (type, id, name) => setDeleteConfirm({ type, id, name });
  const closeDeleteConfirm = () => setDeleteConfirm({ type: null, id: null, name: '' });

  const classOrderMap = useMemo(() => classes.reduce((o, c, i) => { o[c.id] = i; return o; }, {}), [classes]);

  // Group subjects by class for card layout (sorted by class order)
  const subjectsByClass = useMemo(() => {
    const group = {};
    subjects.forEach((sub) => {
      const key = sub.class_id;
      if (!group[key]) {
        group[key] = { class_id: key, class_name: sub.class_name ?? sub.class_id ?? 'Unknown', subjects: [] };
      }
      group[key].subjects.push(sub);
    });
    return Object.values(group).sort((a, b) => (classOrderMap[a.class_id] ?? 999) - (classOrderMap[b.class_id] ?? 999));
  }, [subjects, classOrderMap]);

  // Group sections by class for card layout
  const sectionsByClass = useMemo(() => {
    const group = {};
    sections.forEach((sec) => {
      const key = sec.class_id;
      if (!group[key]) {
        group[key] = { class_id: key, class_name: sec.class_name ?? sec.class_id ?? 'Unknown', sections: [] };
      }
      group[key].sections.push(sec);
    });
    return Object.values(group).sort((a, b) => (classOrderMap[a.class_id] ?? 999) - (classOrderMap[b.class_id] ?? 999));
  }, [sections, classOrderMap]);

  // Group exams by class for card layout
  const examsByClass = useMemo(() => {
    const group = {};
    exams.forEach((exam) => {
      const key = exam.class_id;
      if (!group[key]) {
        group[key] = { class_id: key, class_name: exam.class_name ?? exam.class_id ?? 'Unknown', exams: [] };
      }
      group[key].exams.push(exam);
    });
    return Object.values(group).sort((a, b) => (classOrderMap[a.class_id] ?? 999) - (classOrderMap[b.class_id] ?? 999));
  }, [exams, classOrderMap]);

  const runDelete = () => {
    if (deleteConfirm.type === 'class') handleDeleteClass();
    else if (deleteConfirm.type === 'section') handleDeleteSection();
    else if (deleteConfirm.type === 'subject') handleDeleteSubject();
    else if (deleteConfirm.type === 'exam') handleDeleteExam();
    closeDeleteConfirm();
  };

  return (
    <div className="academic-setup-container">
      <Sidebar />
      <div className="academic-setup-page">
        <div className="academic-setup-header">
          <h1>Academic Setup</h1>
          <p className="academic-setup-subtitle">Manage classes, sections, and subjects</p>
        </div>

        {error && <div className="academic-message academic-error">{error}</div>}
        {success && <div className="academic-message academic-success">{success}</div>}

        <div className="academic-tabs">
          {[
            { key: TABS.CLASSES, label: 'Classes' },
            { key: TABS.SECTIONS, label: 'Sections' },
            { key: TABS.SUBJECTS, label: 'Subjects' },
            { key: TABS.EXAMS, label: 'Exams' }
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`academic-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="academic-content">
          {loading ? (
            <div className="academic-loading">Loading...</div>
          ) : (
            <>
              {activeTab === TABS.CLASSES && (
                <div className="academic-section">
                  <div className="academic-section-header">
                    <h2>Classes</h2>
                    <button type="button" className="academic-btn primary" onClick={openAddClass}>
                      Add Class
                    </button>
                  </div>
                  <div className="academic-table-wrap">
                    <table className="academic-table">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Class</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.length === 0 ? (
                          <tr>
                            <td colSpan={3}>No classes yet. Add one to get started.</td>
                          </tr>
                        ) : (
                          classes.map((row, i) => (
                            <tr key={row.id}>
                              <td>{i + 1}</td>
                              <td>{row.name}</td>
                              <td>
                                <button
                                  type="button"
                                  className="academic-btn small"
                                  onClick={() => openEditClass(row)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="academic-btn small danger"
                                  onClick={() => openDeleteConfirm('class', row.id, row.name)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === TABS.SECTIONS && (
                <div className="academic-section">
                  <div className="academic-section-header">
                    <h2>Sections</h2>
                    <button type="button" className="academic-btn primary" onClick={openAddSection} disabled={!classes.length}>
                      Add Section
                    </button>
                  </div>
                  {!classes.length && (
                    <p className="academic-hint">Add classes first, then add sections for each class.</p>
                  )}
                  {sections.length === 0 ? (
                    <div className="academic-empty-state">
                      <p>No sections yet. Select a class and add one to get started.</p>
                    </div>
                  ) : (
                    <div className="subjects-cards-grid">
                      {sectionsByClass.map((group) => (
                        <div key={group.class_id} className="subject-class-card">
                          <div className="subject-class-card-header">
                            <span className="subject-class-card-title">{group.class_name}</span>
                            <span className="subject-class-card-count">{group.sections.length} section{group.sections.length !== 1 ? 's' : ''}</span>
                          </div>
                          <ul className="subject-class-card-list">
                            {group.sections.map((sec) => (
                              <li key={sec.id} className="subject-class-card-item">
                                <span className="subject-class-card-item-name">{sec.name}</span>
                                <div className="subject-class-card-item-actions">
                                  <button
                                    type="button"
                                    className="academic-btn small"
                                    onClick={() => openEditSection(sec)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="academic-btn small danger"
                                    onClick={() => openDeleteConfirm('section', sec.id, `${sec.name} (${group.class_name})`)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === TABS.SUBJECTS && (
                <div className="academic-section">
                  <div className="academic-section-header">
                    <h2>Subjects</h2>
                    <button type="button" className="academic-btn primary" onClick={openAddSubject} disabled={!classes.length}>
                      Add Subject
                    </button>
                  </div>
                  {!classes.length && (
                    <p className="academic-hint">Add classes first, then you can add subjects for each class.</p>
                  )}
                  {subjects.length === 0 ? (
                    <div className="academic-empty-state">
                      <p>No subjects yet. Add a class first, then add subjects.</p>
                    </div>
                  ) : (
                    <div className="subjects-cards-grid">
                      {subjectsByClass.map((group) => (
                        <div key={group.class_id} className="subject-class-card">
                          <div className="subject-class-card-header">
                            <span className="subject-class-card-title">{group.class_name}</span>
                            <span className="subject-class-card-count">{group.subjects.length} subject{group.subjects.length !== 1 ? 's' : ''}</span>
                          </div>
                          <ul className="subject-class-card-list">
                            {group.subjects.map((sub) => (
                              <li key={sub.id} className="subject-class-card-item">
                                <span className="subject-class-card-item-name">{sub.name}</span>
                                <div className="subject-class-card-item-actions">
                                  <button
                                    type="button"
                                    className="academic-btn small"
                                    onClick={() => openEditSubject(sub)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="academic-btn small danger"
                                    onClick={() => openDeleteConfirm('subject', sub.id, sub.name)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === TABS.EXAMS && (
                <div className="academic-section">
                  <div className="academic-section-header">
                    <h2>Exams</h2>
                    <button type="button" className="academic-btn primary" onClick={openAddExam} disabled={!classes.length}>
                      Add Exam
                    </button>
                  </div>
                  {!classes.length && (
                    <p className="academic-hint">Add classes first, then you can add exams for each class.</p>
                  )}
                  {exams.length === 0 ? (
                    <div className="academic-empty-state">
                      <p>No exams yet. Add a class first, then add exams.</p>
                    </div>
                  ) : (
                    <div className="subjects-cards-grid">
                      {examsByClass.map((group) => (
                        <div key={group.class_id} className="subject-class-card">
                          <div className="subject-class-card-header">
                            <span className="subject-class-card-title">{group.class_name}</span>
                            <span className="subject-class-card-count">{group.exams.length} exam{group.exams.length !== 1 ? 's' : ''}</span>
                          </div>
                          <ul className="subject-class-card-list">
                            {group.exams.map((exam) => (
                              <li key={exam.id} className="subject-class-card-item">
                                <div className="subject-class-card-item-content">
                                  <span className="subject-class-card-item-name">{exam.exam_type || '—'}</span>
                                  <span className="academic-card-item-subtitle">
                                    {[exam.subject_name && exam.subject_name !== 'General' ? exam.subject_name : null, exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : null, exam.max_marks ? `${exam.max_marks} marks` : null].filter(Boolean).join(' · ') || '—'}
                                  </span>
                                </div>
                                <div className="subject-class-card-item-actions">
                                  <button
                                    type="button"
                                    className="academic-btn small"
                                    onClick={() => openEditExam(exam)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="academic-btn small danger"
                                    onClick={() => openDeleteConfirm('exam', exam.id, exam.exam_type || 'this exam')}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Class modal */}
      {showClassModal && (
        <div className="academic-modal-overlay" onClick={() => setShowClassModal(false)}>
          <div className="academic-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingClass ? 'Update Class' : 'Add Class'}</h3>
            <form onSubmit={handleSaveClass}>
              <label>Name</label>
              <input
                type="text"
                value={classForm.name}
                onChange={(e) => setClassForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. PreKG, LKG, UKG, 1, 2, … 12"
                required
              />
              <div className="academic-modal-actions">
                <button type="button" className="academic-btn" onClick={() => setShowClassModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="academic-btn primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section modal */}
      {showSectionModal && (
        <div className="academic-modal-overlay" onClick={() => setShowSectionModal(false)}>
          <div className="academic-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingSection ? 'Update Section' : 'Add Section'}</h3>
            <form onSubmit={handleSaveSection}>
              <label>Class</label>
              <select
                value={sectionForm.class_id}
                onChange={(e) => setSectionForm((f) => ({ ...f, class_id: e.target.value }))}
                required
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <label>Section name</label>
              <input
                type="text"
                value={sectionForm.name}
                onChange={(e) => setSectionForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. A, B, C"
                required
              />
              <div className="academic-modal-actions">
                <button type="button" className="academic-btn" onClick={() => setShowSectionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="academic-btn primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject modal */}
      {showSubjectModal && (
        <div className="academic-modal-overlay" onClick={() => setShowSubjectModal(false)}>
          <div className="academic-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingSubject ? 'Update Subject' : 'Add Subject'}</h3>
            <form onSubmit={handleSaveSubject}>
              <label>Class</label>
              <select
                value={subjectForm.class_id}
                onChange={(e) => setSubjectForm((f) => ({ ...f, class_id: e.target.value }))}
                required
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <label>Subject name</label>
              <input
                type="text"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Mathematics, Science"
                required
              />
              <div className="academic-modal-actions">
                <button type="button" className="academic-btn" onClick={() => setShowSubjectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="academic-btn primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exam modal */}
      {showExamModal && (
        <div className="academic-modal-overlay" onClick={() => setShowExamModal(false)}>
          <div className="academic-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingExam ? 'Update Exam' : 'Add Exam'}</h3>
            <form onSubmit={handleSaveExam}>
              <label>Class *</label>
              <select
                value={examForm.class_id}
                onChange={(e) => {
                  setExamForm((f) => ({ ...f, class_id: e.target.value, subject_id: '' }));
                }}
                required
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              
              <label>Subject (Optional)</label>
              <select
                value={examForm.subject_id}
                onChange={(e) => setExamForm((f) => ({ ...f, subject_id: e.target.value }))}
              >
                <option value="">No subject (General)</option>
                {examForm.class_id && subjects
                  .filter(s => s.class_id === Number(examForm.class_id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>

              <label>Exam Type *</label>
              <input
                type="text"
                value={examForm.exam_type}
                onChange={(e) => setExamForm((f) => ({ ...f, exam_type: e.target.value }))}
                placeholder="e.g. Midterm, Final, Assignment"
                required
              />

              <label>Exam Date</label>
              <input
                type="date"
                value={examForm.exam_date}
                onChange={(e) => setExamForm((f) => ({ ...f, exam_date: e.target.value }))}
              />

              <label>Max Marks *</label>
              <input
                type="number"
                value={examForm.max_marks}
                onChange={(e) => setExamForm((f) => ({ ...f, max_marks: e.target.value }))}
                placeholder="100"
                min="1"
                step="0.01"
                required
              />

              <label>Description</label>
              <textarea
                value={examForm.description}
                onChange={(e) => setExamForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description or instructions"
                rows="3"
              />

              <div className="academic-modal-actions">
                <button type="button" className="academic-btn" onClick={() => setShowExamModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="academic-btn primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm.type && (
        <div className="academic-modal-overlay" onClick={closeDeleteConfirm}>
          <div className="academic-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm remove</h3>
            <p>Remove &quot;{deleteConfirm.name}&quot;? This action cannot be undone.</p>
            <div className="academic-modal-actions">
              <button type="button" className="academic-btn" onClick={closeDeleteConfirm}>Cancel</button>
              <button type="button" className="academic-btn danger" onClick={runDelete}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAcademicSetup;
