import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, Area, AreaChart, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import './AdminStudentProgress.css';
import Sidebar from '../../components/layout/Sidebar';
import { getAllStudents } from '../../services/student.service.js';
import { getClasses, getSections, getExams } from '../../services/academic.service.js';
import { getMarksByStudent, getMarksSummary, getExamTimeline } from '../../services/marks.service.js';

// ─── Colours ──────────────────────────────────────────────────────────────────
const RANK_COLORS     = ['#fbbf24', '#94a3b8', '#f97316'];
const STUDENT_COLOR   = '#2563eb';
const COMPARE_COLOR   = '#10b981';
const CLASS_AVG_COLOR = '#f59e0b';
const SEC_A_COLOR     = '#6366f1';
const SEC_B_COLOR     = '#ec4899';

function getRankColor(rank) {
  return rank <= 3 ? RANK_COLORS[rank - 1] : '#e5e7eb';
}

// ─── Class sort order ─────────────────────────────────────────────────────────
function classOrder(name) {
  if (!name) return 999;
  const n = String(name).trim();
  if (/^PreKG$/i.test(n)) return 0;
  if (/^LKG$/i.test(n))   return 1;
  if (/^UKG$/i.test(n))   return 2;
  const num = parseInt(n, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= 12) return 3 + num;
  return 999;
}

// ─── Build per-subject average % ─────────────────────────────────────────────
function buildSubjectMap(marks) {
  const map = {};
  marks.forEach((m) => {
    const sub = m.subject_name || m.subject || 'General';
    if (!map[sub]) map[sub] = { sum: 0, count: 0 };
    const max = Number(m.max_marks) || 100;
    map[sub].sum   += (Number(m.obtained_marks ?? m.marks ?? 0) / max) * 100;
    map[sub].count += 1;
  });
  return Object.entries(map).map(([subject, d]) => ({
    subject,
    percentage: parseFloat((d.sum / d.count).toFixed(1)),
  }));
}

// ─── Build per-exam-date average % ───────────────────────────────────────────
function buildTrendMap(marks) {
  const sorted = [...marks].sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
  const byDate = {};
  sorted.forEach((m) => {
    const d = m.exam_date ? String(m.exam_date).slice(0, 10) : 'Unknown';
    if (!byDate[d]) byDate[d] = { sum: 0, count: 0 };
    const max = Number(m.max_marks) || 100;
    byDate[d].sum   += (Number(m.obtained_marks ?? m.marks ?? 0) / max) * 100;
    byDate[d].count += 1;
  });
  return Object.entries(byDate).map(([date, d]) => ({
    date,
    percentage: parseFloat((d.sum / d.count).toFixed(1)),
  }));
}

// ─── Get marks for a student from the allMarks cache (keyed by student_id) ───
function getMarksForStudent(studentId, allMarksMap) {
  return allMarksMap[studentId] || [];
}

// ─── Average of a student-summary array ──────────────────────────────────────
function sectionAvg(summaries) {
  const w = summaries.filter((s) => s.avg != null);
  if (!w.length) return null;
  return parseFloat((w.reduce((s, x) => s + x.avg, 0) / w.length).toFixed(1));
}

// ─── Dark tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="aspv-tooltip">
      <p className="aspv-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="aspv-tooltip-row" style={{ color: p.color }}>
          <span className="aspv-tooltip-dot" style={{ background: p.color }} />
          {p.name}: <strong>{typeof p.value === 'number' ? `${p.value}%` : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminStudentProgress() {
  const [allStudents,  setAllStudents]  = useState([]);
  const [allExams,     setAllExams]     = useState([]);
  const [allClasses,   setAllClasses]   = useState([]);
  const [allSections,  setAllSections]  = useState([]);
  // allMarksMap: { [student_id]: [ markRow, ... ] }
  const [allMarksMap,  setAllMarksMap]  = useState({});
  // examTimeline: real per-exam class averages from student_marks
  const [examTimeline, setExamTimeline] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  // ── Selection state ──────────────────────────────────────────────────────────
  const [selectedClass,   setSelectedClass]   = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [compareSection,  setCompareSection]  = useState('');

  const [searchQuery,  setSearchQuery]  = useState('');
  const [activeTab,    setActiveTab]    = useState('overview');

  // Individual student
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [compareStudent,  setCompareStudent]  = useState(null);

  // ── Initial load: students, exams, classes, sections ─────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [students, exams, classes, sections] = await Promise.all([
          getAllStudents(),
          getExams(),
          getClasses(),
          getSections(),
        ]);
        const studentList = Array.isArray(students) ? students : [];
        setAllStudents(studentList);
        setAllExams(Array.isArray(exams) ? exams : []);
        setAllClasses(Array.isArray(classes) ? classes : []);
        setAllSections(Array.isArray(sections) ? sections : []);

        // Pre-load marks for all students in one batch
        if (studentList.length > 0) {
          const markResults = await Promise.all(
            studentList.map((s) =>
              getMarksByStudent(s.student_id || String(s.id)).catch(() => [])
            )
          );
          const map = {};
          studentList.forEach((s, i) => {
            map[s.student_id || String(s.id)] = markResults[i];
          });
          setAllMarksMap(map);
        }
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Re-fetch exam timeline whenever selected class changes ────────────────────
  useEffect(() => {
    if (!selectedClass) { setExamTimeline([]); return; }
    getExamTimeline(selectedClass)
      .then((rows) => setExamTimeline(Array.isArray(rows) ? rows : []))
      .catch(() => setExamTimeline([]));
  }, [selectedClass]);

  // ── Derived lists — driven by DB tables, not student records ─────────────────
  // classes are already sorted by the backend (PreKG → LKG → UKG → 1..12)
  const classes = useMemo(() => allClasses.map((c) => c.name), [allClasses]);

  // sections that belong to the selected class (matched by class_name from JOIN)
  const sectionsForClass = useMemo(() => {
    if (!selectedClass) return [];
    return allSections
      .filter((s) => s.class_name === selectedClass)
      .map((s) => s.name)
      .sort();
  }, [allSections, selectedClass]);

  // Students in selected class + section
  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      if (selectedClass   && s.class   !== selectedClass)   return false;
      if (selectedSection && s.section !== selectedSection) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (s.name || '').toLowerCase().includes(q) ||
               (s.student_id || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [allStudents, selectedClass, selectedSection, searchQuery]);

  // Students in compare section (same class, different section)
  const compareSectionStudents = useMemo(() => {
    if (!selectedClass || !compareSection) return [];
    return allStudents.filter(
      (s) => s.class === selectedClass && s.section === compareSection
    );
  }, [allStudents, selectedClass, compareSection]);

  // ── Build summaries from real marks ──────────────────────────────────────────
  const buildSummaries = (students) => {
    const raw = students.map((s) => {
      const sid   = s.student_id || String(s.id);
      const marks = getMarksForStudent(sid, allMarksMap);
      const avg   = marks.length
        ? parseFloat((marks.reduce(
            (sum, m) => sum + (Number(m.obtained_marks) / Number(m.max_marks || 100)) * 100, 0
          ) / marks.length).toFixed(1))
        : null;
      return {
        student_id: sid,
        name      : s.name || s.student_id,
        class     : s.class,
        section   : s.section,
        avg,
        count     : marks.length,
      };
    });
    return raw
      .sort((a, b) => {
        if (a.avg == null && b.avg == null) return 0;
        if (a.avg == null) return 1;
        if (b.avg == null) return -1;
        return b.avg - a.avg;
      })
      .map((s, i) => ({ ...s, rank: i + 1 }));
  };

  const studentSummaries        = useMemo(() => buildSummaries(filteredStudents),       [filteredStudents, allMarksMap]);
  const compareSectionSummaries = useMemo(() => buildSummaries(compareSectionStudents), [compareSectionStudents, allMarksMap]);

  const sectionAverageA = useMemo(() => sectionAvg(studentSummaries),        [studentSummaries]);
  const sectionAverageB = useMemo(() => sectionAvg(compareSectionSummaries), [compareSectionSummaries]);

  // ── Individual student marks / chart data (from real student_marks table) ────
  const selectedMarks = useMemo(() => {
    if (!selectedStudent) return [];
    const sid = selectedStudent.student_id || String(selectedStudent.id);
    return (allMarksMap[sid] || []).map((m) => ({
      subject_name  : m.subject,
      exam_type     : m.exam_type,
      exam_date     : m.exam_date,
      max_marks     : Number(m.max_marks) || 100,
      obtained_marks: Number(m.obtained_marks) || 0,
    }));
  }, [selectedStudent, allMarksMap]);

  const compareMarks = useMemo(() => {
    if (!compareStudent) return [];
    const sid = compareStudent.student_id || String(compareStudent.id);
    return (allMarksMap[sid] || []).map((m) => ({
      subject_name  : m.subject,
      exam_type     : m.exam_type,
      exam_date     : m.exam_date,
      max_marks     : Number(m.max_marks) || 100,
      obtained_marks: Number(m.obtained_marks) || 0,
    }));
  }, [compareStudent, allMarksMap]);

  const selectedName = selectedStudent?.name || selectedStudent?.student_id || '';
  const compareName  = compareStudent?.name  || compareStudent?.student_id  || '';

  const subjectData        = buildSubjectMap(selectedMarks);
  const trendData          = buildTrendMap(selectedMarks);
  const compareSubjectData = buildSubjectMap(compareMarks);
  const compareTrendData   = buildTrendMap(compareMarks);

  const allSubjects = useMemo(() => Array.from(new Set([
    ...subjectData.map((d) => d.subject),
    ...compareSubjectData.map((d) => d.subject),
  ])), [subjectData, compareSubjectData]);

  const mergedSubjectData = useMemo(() => allSubjects.map((sub) => ({
    subject: sub,
    [selectedName]: subjectData.find((d) => d.subject === sub)?.percentage ?? 0,
    ...(compareStudent ? { [compareName]: compareSubjectData.find((d) => d.subject === sub)?.percentage ?? 0 } : {}),
  })), [allSubjects, subjectData, compareSubjectData, selectedName, compareName, compareStudent]);

  const allDates = useMemo(() => Array.from(new Set([
    ...trendData.map((d) => d.date),
    ...compareTrendData.map((d) => d.date),
  ])).sort(), [trendData, compareTrendData]);

  const mergedTrendData = useMemo(() => allDates.map((date) => ({
    date,
    [selectedName]: trendData.find((d) => d.date === date)?.percentage ?? null,
    ...(compareStudent ? { [compareName]: compareTrendData.find((d) => d.date === date)?.percentage ?? null } : {}),
  })), [allDates, trendData, compareTrendData, selectedName, compareName, compareStudent]);

  const radarData = useMemo(() => allSubjects.map((sub) => ({
    subject: sub,
    [selectedName]: subjectData.find((d) => d.subject === sub)?.percentage ?? 0,
    ...(compareStudent ? { [compareName]: compareSubjectData.find((d) => d.subject === sub)?.percentage ?? 0 } : {}),
  })), [allSubjects, subjectData, compareSubjectData, selectedName, compareName, compareStudent]);

  const selectedSummary = studentSummaries.find(
    (s) => s.student_id === (selectedStudent?.student_id || String(selectedStudent?.id))
  );
  const compareSummary = studentSummaries.find(
    (s) => s.student_id === (compareStudent?.student_id || String(compareStudent?.id))
  ) ?? compareSectionSummaries.find(
    (s) => s.student_id === (compareStudent?.student_id || String(compareStudent?.id))
  );

  // Compare dropdown: all students in same class (any section) except selected
  const compareOptions = useMemo(() => {
    if (!selectedClass) return [];
    return allStudents
      .filter((s) => s.class === selectedClass &&
        (s.student_id || String(s.id)) !== (selectedStudent?.student_id || String(selectedStudent?.id)))
      .map((s) => {
        const summary = [...studentSummaries, ...compareSectionSummaries].find(
          (x) => x.student_id === (s.student_id || String(s.id))
        );
        return { ...s, avg: summary?.avg ?? null };
      })
      .sort((a, b) => (a.section || '').localeCompare(b.section || '') || (a.name || '').localeCompare(b.name || ''));
  }, [allStudents, selectedClass, selectedStudent, studentSummaries, compareSectionSummaries]);

  // ── Exam progress timeline — built from real student_marks data ──────────────
  const classExamTimeline = useMemo(() => {
    // Count how many times each type+subject combo appears — if >1, append date
    const comboCount = {};
    examTimeline.forEach((e) => {
      const key = `${e.exam_type}||${e.subject || 'General'}`;
      comboCount[key] = (comboCount[key] || 0) + 1;
    });

    return examTimeline.map((e) => {
      const dateStr = e.exam_date ? String(e.exam_date).slice(0, 10) : null;
      const subj    = e.subject || 'General';
      const base    = `${e.exam_type}${subj !== 'General' ? ` · ${subj}` : ''}`;
      const key     = `${e.exam_type}||${subj}`;
      // Only append date when the same type+subject appears more than once
      const shortLabel = comboCount[key] > 1 && dateStr
        ? `${base} (${dateStr})`
        : base;

      return {
        shortLabel,
        date        : dateStr || 'No date',
        examType    : e.exam_type,
        subject     : subj,
        maxMarks    : Number(e.max_marks) || 100,
        avgPct      : Number(e.avg_pct)   || 0,
        studentCount: Number(e.student_count) || 0,
      };
    });
  }, [examTimeline]);

  // ── Section comparison chart data ────────────────────────────────────────────
  // Bar chart: each student in section A vs section B by name
  const sectionCompareBarData = useMemo(() => {
    const labelA = `Section ${selectedSection}`;
    const labelB = `Section ${compareSection}`;
    const maxLen = Math.max(studentSummaries.length, compareSectionSummaries.length);
    return Array.from({ length: maxLen }, (_, i) => ({
      index   : i + 1,
      [labelA]: studentSummaries[i]?.avg ?? null,
      [`${labelA}_name`]: studentSummaries[i]?.name ?? '',
      [labelB]: compareSectionSummaries[i]?.avg ?? null,
      [`${labelB}_name`]: compareSectionSummaries[i]?.name ?? '',
    }));
  }, [studentSummaries, compareSectionSummaries, selectedSection, compareSection]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleClassChange = (cls) => {
    setSelectedClass(cls);
    setSelectedSection('');
    setCompareSection('');
    setSelectedStudent(null);
    setCompareStudent(null);
    setActiveTab('overview');
    setSearchQuery('');
  };

  const handleSectionChange = (sec) => {
    setSelectedSection(sec);
    setCompareSection('');
    setSelectedStudent(null);
    setCompareStudent(null);
    setActiveTab('overview');
    setSearchQuery('');
  };

  const handleSelectStudent = (summary) => {
    const student = allStudents.find(
      (s) => (s.student_id || String(s.id)) === summary.student_id
    );
    if (!student) return;
    setSelectedStudent(student);
    setCompareStudent(null);
    setActiveTab('individual');
  };

  const handleCompareSelect = (val) => {
    if (!val) { setCompareStudent(null); return; }
    const student = allStudents.find((s) => (s.student_id || String(s.id)) === val);
    if (student) setCompareStudent(student);
  };

  // ── Loading / error ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="aspv-container">
        <Sidebar />
        <div className="aspv-page">
          <div className="aspv-loading"><div className="aspv-spinner" /><p>Loading student data...</p></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspv-container">
        <Sidebar />
        <div className="aspv-page"><div className="aspv-error-box">{error}</div></div>
      </div>
    );
  }

  const hasClass   = !!selectedClass;
  const hasSection = !!selectedSection;
  const labelA     = `Sec ${selectedSection}`;
  const labelB     = `Sec ${compareSection}`;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="aspv-container">
      <Sidebar />
      <div className="aspv-page">

        {/* ── Header ── */}
        <div className="aspv-header">
          <div>
            <h1 className="aspv-title">Student Progress</h1>
            <p className="aspv-subtitle">
              Select a class and section to view student progress. Compare sections or individual students.
            </p>
          </div>
          {hasClass && hasSection && (
            <div className="aspv-stats-row">
              <div className="aspv-stat">
                <span className="aspv-stat-value">{filteredStudents.length}</span>
                <span className="aspv-stat-label">Students</span>
              </div>
              <div className="aspv-stat">
                <span className="aspv-stat-value">{studentSummaries.filter((s) => s.count > 0).length}</span>
                <span className="aspv-stat-label">With Exams</span>
              </div>
              <div className="aspv-stat highlight">
                <span className="aspv-stat-value">
                  {sectionAverageA != null ? `${sectionAverageA}%` : '—'}
                </span>
                <span className="aspv-stat-label">
                  Class {selectedClass} – {selectedSection} Avg
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Selector panel ── */}
        <div className="aspv-selector-panel">
          {/* Class dropdown */}
          <div className="aspv-selector-group">
            <label className="aspv-selector-label">Class</label>
            <select
              className="aspv-selector-dropdown"
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
            >
              <option value="">— Select Class —</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Section A dropdown */}
          <div className="aspv-selector-group">
            <label className="aspv-selector-label">Section</label>
            <select
              className="aspv-selector-dropdown"
              value={selectedSection}
              onChange={(e) => handleSectionChange(e.target.value)}
              disabled={!hasClass}
            >
              <option value="">— Select Section —</option>
              {sectionsForClass.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Compare section dropdown (only when a section is chosen) */}
          {hasSection && sectionsForClass.length > 1 && (
            <div className="aspv-selector-group">
              <label className="aspv-selector-label">Compare Section</label>
              <select
                className="aspv-selector-dropdown compare"
                value={compareSection}
                onChange={(e) => {
                  setCompareSection(e.target.value);
                  setActiveTab('overview');
                  setSelectedStudent(null);
                  setCompareStudent(null);
                }}
              >
                <option value="">— None —</option>
                {sectionsForClass
                  .filter((s) => s !== selectedSection)
                  .map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Active context badge */}
          {hasClass && (
            <div className="aspv-context-badge">
              <span className="aspv-context-class">Class {selectedClass}</span>
              {hasSection && <span className="aspv-context-sep">›</span>}
              {hasSection && <span className="aspv-context-sec">{selectedSection}</span>}
              {compareSection && <span className="aspv-context-sep">vs</span>}
              {compareSection && <span className="aspv-context-sec compare">{compareSection}</span>}
            </div>
          )}
        </div>

        {/* ── Prompt when no class/section selected ── */}
        {!hasClass && (
          <div className="aspv-prompt">
            <div className="aspv-prompt-icon">🎓</div>
            <h3>Select a Class to Begin</h3>
            <p>Choose a class from the dropdown above to view student progress and compare sections.</p>
          </div>
        )}

        {hasClass && !hasSection && (
          <div className="aspv-prompt">
            <div className="aspv-prompt-icon">📋</div>
            <h3>Select a Section</h3>
            <p>Class <strong>{selectedClass}</strong> has {sectionsForClass.length} section{sectionsForClass.length !== 1 ? 's' : ''}: {sectionsForClass.join(', ')}. Pick one to view students.</p>
          </div>
        )}

        {/* ── Main content (class + section selected) ── */}
        {hasClass && hasSection && (
          <>
            {/* Tabs */}
            <div className="aspv-tabs">
              <button
                className={`aspv-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                {compareSection ? `Section ${selectedSection} Overview` : 'Class Overview'}
              </button>
              {compareSection && (
                <button
                  className={`aspv-tab ${activeTab === 'section-compare' ? 'active' : ''}`}
                  onClick={() => setActiveTab('section-compare')}
                >
                  {selectedSection} vs {compareSection}
                </button>
              )}
              <button
                className={`aspv-tab ${activeTab === 'individual' ? 'active' : ''}`}
                onClick={() => selectedStudent && setActiveTab('individual')}
                disabled={!selectedStudent}
              >
                {selectedStudent ? selectedName : 'Select a Student'}
              </button>
              {selectedStudent && compareStudent && (
                <button
                  className={`aspv-tab ${activeTab === 'compare' ? 'active' : ''}`}
                  onClick={() => setActiveTab('compare')}
                >
                  {selectedName} vs {compareName}
                </button>
              )}
            </div>

            <div className="aspv-body">

              {/* ══════════════ OVERVIEW TAB ══════════════ */}
              {activeTab === 'overview' && (
                <div className="aspv-overview">
                  <div className="aspv-overview-layout">

                    {/* Left: ranked list */}
                    <div className="aspv-student-panel">
                      <div className="aspv-panel-header">
                        <span>Section {selectedSection} — Ranked</span>
                        <span className="aspv-panel-hint">Click to view</span>
                      </div>
                      <div className="aspv-search-wrap">
                        <input
                          className="aspv-search"
                          type="text"
                          placeholder="Search name or ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="aspv-student-list">
                        {studentSummaries.length === 0 ? (
                          <p className="aspv-no-data">No students in this section.</p>
                        ) : (
                          studentSummaries.map((s) => {
                            const isSelected =
                              selectedStudent &&
                              (selectedStudent.student_id || String(selectedStudent.id)) === s.student_id;
                            return (
                              <div
                                key={s.student_id}
                                className={`aspv-student-item ${isSelected ? 'active' : ''}`}
                                onClick={() => handleSelectStudent(s)}
                              >
                                <span
                                  className="aspv-rank-badge"
                                  style={{ background: getRankColor(s.rank), color: s.rank <= 3 ? '#fff' : '#374151' }}
                                >
                                  {s.rank}
                                </span>
                                <div className="aspv-student-info">
                                  <span className="aspv-student-name">{s.name}</span>
                                  <span className="aspv-student-meta">
                                    {s.class}{s.section ? `-${s.section}` : ''} ·{' '}
                                    {s.avg != null ? `${s.avg}%` : 'No exams'} · {s.count} exam{s.count !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                {s.avg != null && (
                                  <div className="aspv-mini-bar-wrap">
                                    <div className="aspv-mini-bar" style={{ width: `${s.avg}%` }} />
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Right: charts column */}
                    <div className="aspv-charts-col">

                      {/* Student ranking bar chart */}
                      <div className="aspv-chart-panel">
                        <h3 className="aspv-chart-title">
                          Class {selectedClass} – Section {selectedSection} — Student Average Score (%)
                        </h3>
                        {studentSummaries.length === 0 ? (
                          <p className="aspv-no-data">No student data available.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={Math.max(220, studentSummaries.length * 44)}>
                            <BarChart
                              data={studentSummaries.map((s) => ({
                                name: s.name.length > 20 ? `${s.name.slice(0, 18)}…` : s.name,
                                avg : s.avg ?? 0,
                              }))}
                              layout="vertical"
                              margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
                              barCategoryGap="20%"
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`}
                                tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="name" width={140}
                                tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
                              {sectionAverageA != null && (
                                <ReferenceLine x={sectionAverageA} stroke={CLASS_AVG_COLOR} strokeDasharray="5 4" strokeWidth={1.5}
                                  label={{ value: `Avg ${sectionAverageA}%`, position: 'insideTopRight', fontSize: 11, fill: CLASS_AVG_COLOR, fontWeight: 600 }}
                                />
                              )}
                              <Bar dataKey="avg" name="Average %" radius={[0, 6, 6, 0]} fill={STUDENT_COLOR}
                                label={{ position: 'right', formatter: (v) => (v > 0 ? `${v}%` : '—'), fontSize: 11, fill: '#475569', fontWeight: 600 }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>

                      {/* Exam progress timeline */}
                      <div className="aspv-chart-panel">
                        <div className="aspv-chart-title-row">
                          <h3 className="aspv-chart-title">
                            Class {selectedClass} — Exam Progress Timeline
                          </h3>
                          <span className="aspv-chart-subtitle">
                            {classExamTimeline.length} exam{classExamTimeline.length !== 1 ? 's' : ''} scheduled
                          </span>
                        </div>
                        {classExamTimeline.length === 0 ? (
                          <p className="aspv-no-data">No exams found for Class {selectedClass}. Add exams in Academic Setup.</p>
                        ) : (
                          <>
                            {/* Exam cards row */}
                            <div className="aspv-exam-cards-row">
                              {classExamTimeline.map((e, i) => (
                                <div key={i} className="aspv-exam-card">
                                  <span className="aspv-exam-card-type">{e.examType}</span>
                                  <span className="aspv-exam-card-subject">{e.subject}</span>
                                  <span className="aspv-exam-card-date">{e.date !== 'No date' ? e.date : 'No date'}</span>
                                  <span className="aspv-exam-card-avg">{e.avgPct}%</span>
                                  <span className="aspv-exam-card-marks">/ {e.maxMarks} marks</span>
                                </div>
                              ))}
                            </div>

                            {/* Line chart — exam score trend */}
                            <ResponsiveContainer width="100%" height={220}>
                              <LineChart
                                data={classExamTimeline}
                                margin={{ top: 16, right: 24, left: 0, bottom: 60 }}
                              >
                                <defs>
                                  <linearGradient id="examGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={SEC_A_COLOR} stopOpacity={0.15} />
                                    <stop offset="95%" stopColor={SEC_A_COLOR} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                  dataKey="shortLabel"
                                  tick={{ fontSize: 11, fill: '#64748b' }}
                                  angle={-35}
                                  textAnchor="end"
                                  interval={0}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  domain={[0, 100]}
                                  tickFormatter={(v) => `${v}%`}
                                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0]?.payload;
                                    return (
                                      <div className="aspv-tooltip">
                                        <p className="aspv-tooltip-label">{d?.examType} — {d?.subject}</p>
                                        <p className="aspv-tooltip-row" style={{ color: '#94a3b8' }}>
                                          Date: <strong>{d?.date}</strong>
                                        </p>
                                        <p className="aspv-tooltip-row" style={{ color: '#94a3b8' }}>
                                          Max Marks: <strong>{d?.maxMarks}</strong>
                                        </p>
                                        <p className="aspv-tooltip-row" style={{ color: SEC_A_COLOR }}>
                                          <span className="aspv-tooltip-dot" style={{ background: SEC_A_COLOR }} />
                                          Class Avg: <strong>{d?.avgPct}%</strong>
                                        </p>
                                      </div>
                                    );
                                  }}
                                />
                                {sectionAverageA != null && (
                                  <ReferenceLine
                                    y={sectionAverageA}
                                    stroke={CLASS_AVG_COLOR}
                                    strokeDasharray="5 4"
                                    strokeWidth={1.5}
                                    label={{ value: `Section Avg ${sectionAverageA}%`, position: 'insideTopRight', fontSize: 11, fill: CLASS_AVG_COLOR, fontWeight: 600 }}
                                  />
                                )}
                                <Line
                                  type="monotone"
                                  dataKey="avgPct"
                                  name="Class Avg %"
                                  stroke={SEC_A_COLOR}
                                  strokeWidth={2.5}
                                  dot={{ r: 6, fill: SEC_A_COLOR, stroke: '#fff', strokeWidth: 2 }}
                                  activeDot={{ r: 8, fill: SEC_A_COLOR, stroke: '#fff', strokeWidth: 2 }}
                                  connectNulls
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════ SECTION COMPARE TAB ══════════════ */}
              {activeTab === 'section-compare' && compareSection && (
                <div className="aspv-sec-compare">

                  {/* Summary cards */}
                  <div className="aspv-sec-cards">
                    <div className="aspv-sec-card" style={{ borderColor: SEC_A_COLOR }}>
                      <div className="aspv-sec-card-header" style={{ background: SEC_A_COLOR }}>
                        Class {selectedClass} – Section {selectedSection}
                      </div>
                      <div className="aspv-sec-card-body">
                        <span className="aspv-sec-avg">{sectionAverageA != null ? `${sectionAverageA}%` : '—'}</span>
                        <span className="aspv-sec-label">Section Average</span>
                        <span className="aspv-sec-count">{filteredStudents.length} students</span>
                      </div>
                    </div>

                    <div className="aspv-sec-vs">
                      <span>VS</span>
                      {sectionAverageA != null && sectionAverageB != null && (
                        <p className={`aspv-winner ${sectionAverageA >= sectionAverageB ? 'blue' : 'green'}`}>
                          Sec {sectionAverageA >= sectionAverageB ? selectedSection : compareSection} leads
                          by {Math.abs(sectionAverageA - sectionAverageB).toFixed(1)}%
                        </p>
                      )}
                    </div>

                    <div className="aspv-sec-card" style={{ borderColor: SEC_B_COLOR }}>
                      <div className="aspv-sec-card-header" style={{ background: SEC_B_COLOR }}>
                        Class {selectedClass} – Section {compareSection}
                      </div>
                      <div className="aspv-sec-card-body">
                        <span className="aspv-sec-avg">{sectionAverageB != null ? `${sectionAverageB}%` : '—'}</span>
                        <span className="aspv-sec-label">Section Average</span>
                        <span className="aspv-sec-count">{compareSectionStudents.length} students</span>
                      </div>
                    </div>
                  </div>

                  {/* Side-by-side ranked lists */}
                  <div className="aspv-sec-lists">
                    {/* Section A list */}
                    <div className="aspv-student-panel">
                      <div className="aspv-panel-header" style={{ borderLeft: `4px solid ${SEC_A_COLOR}` }}>
                        <span>Section {selectedSection}</span>
                        <span className="aspv-panel-hint">{filteredStudents.length} students</span>
                      </div>
                      <div className="aspv-student-list">
                        {studentSummaries.length === 0 ? (
                          <p className="aspv-no-data">No students.</p>
                        ) : studentSummaries.map((s) => (
                          <div key={s.student_id} className="aspv-student-item"
                            onClick={() => handleSelectStudent(s)}>
                            <span className="aspv-rank-badge"
                              style={{ background: getRankColor(s.rank), color: s.rank <= 3 ? '#fff' : '#374151' }}>
                              {s.rank}
                            </span>
                            <div className="aspv-student-info">
                              <span className="aspv-student-name">{s.name}</span>
                              <span className="aspv-student-meta">
                                {s.avg != null ? `${s.avg}%` : 'No exams'} · {s.count} exam{s.count !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {s.avg != null && (
                              <div className="aspv-mini-bar-wrap">
                                <div className="aspv-mini-bar" style={{ width: `${s.avg}%`, background: SEC_A_COLOR }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section B list */}
                    <div className="aspv-student-panel">
                      <div className="aspv-panel-header" style={{ borderLeft: `4px solid ${SEC_B_COLOR}` }}>
                        <span>Section {compareSection}</span>
                        <span className="aspv-panel-hint">{compareSectionStudents.length} students</span>
                      </div>
                      <div className="aspv-student-list">
                        {compareSectionSummaries.length === 0 ? (
                          <p className="aspv-no-data">No students.</p>
                        ) : compareSectionSummaries.map((s) => (
                          <div key={s.student_id} className="aspv-student-item"
                            onClick={() => {
                              const st = allStudents.find((x) => (x.student_id || String(x.id)) === s.student_id);
                              if (st) { setSelectedStudent(st); setCompareStudent(null); setActiveTab('individual'); }
                            }}>
                            <span className="aspv-rank-badge"
                              style={{ background: getRankColor(s.rank), color: s.rank <= 3 ? '#fff' : '#374151' }}>
                              {s.rank}
                            </span>
                            <div className="aspv-student-info">
                              <span className="aspv-student-name">{s.name}</span>
                              <span className="aspv-student-meta">
                                {s.avg != null ? `${s.avg}%` : 'No exams'} · {s.count} exam{s.count !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {s.avg != null && (
                              <div className="aspv-mini-bar-wrap">
                                <div className="aspv-mini-bar" style={{ width: `${s.avg}%`, background: SEC_B_COLOR }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Grouped bar chart: section A vs B */}
                  <div className="aspv-card aspv-card-full" style={{ marginTop: 20 }}>
                    <h3 className="aspv-card-title">
                      Section {selectedSection} vs Section {compareSection} — Student Averages
                    </h3>
                    {sectionCompareBarData.length === 0 ? (
                      <p className="aspv-no-data">No data to compare.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={Math.max(260, sectionCompareBarData.length * 52)}>
                        <BarChart
                          data={sectionCompareBarData}
                          layout="vertical"
                          margin={{ top: 8, right: 60, left: 8, bottom: 8 }}
                          barCategoryGap="18%"
                          barGap={4}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`}
                            tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="index" width={40}
                            tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => `#${v}`} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                          <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                          <Bar dataKey={labelA} fill={SEC_A_COLOR} radius={[0, 5, 5, 0]}
                            label={{ position: 'right', formatter: (v) => (v != null && v > 0 ? `${v}%` : ''), fontSize: 10, fill: '#475569' }} />
                          <Bar dataKey={labelB} fill={SEC_B_COLOR} radius={[0, 5, 5, 0]}
                            label={{ position: 'right', formatter: (v) => (v != null && v > 0 ? `${v}%` : ''), fontSize: 10, fill: '#475569' }} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════ INDIVIDUAL TAB ══════════════ */}
              {activeTab === 'individual' && selectedStudent && (
                <div className="aspv-individual">
                  <div className="aspv-individual-header">
                    <div className="aspv-individual-info">
                      <span className="aspv-rank-badge large"
                        style={{ background: getRankColor(selectedSummary?.rank), color: selectedSummary?.rank <= 3 ? '#fff' : '#374151' }}>
                        #{selectedSummary?.rank || '—'}
                      </span>
                      <div>
                        <h2 className="aspv-individual-name">{selectedName}</h2>
                        <p className="aspv-individual-meta">
                          Class {selectedStudent.class}{selectedStudent.section ? `-${selectedStudent.section}` : ''} ·{' '}
                          Average: <strong>{selectedSummary?.avg != null ? `${selectedSummary.avg}%` : 'No exams'}</strong>
                          {selectedSummary?.avg != null && sectionAverageA != null && (
                            <span className={`aspv-diff-badge ${selectedSummary.avg >= sectionAverageA ? 'pos' : 'neg'}`}>
                              {selectedSummary.avg >= sectionAverageA ? '+' : ''}
                              {(selectedSummary.avg - sectionAverageA).toFixed(1)}% vs section avg
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="aspv-compare-selector">
                      <label className="aspv-compare-label">Compare with:</label>
                      <select
                        className="aspv-compare-dropdown"
                        value={compareStudent ? (compareStudent.student_id || String(compareStudent.id)) : ''}
                        onChange={(e) => handleCompareSelect(e.target.value)}
                      >
                        <option value="">— Select student (any section) —</option>
                        {compareOptions.map((s) => (
                          <option key={s.student_id || String(s.id)} value={s.student_id || String(s.id)}>
                            {s.name} (Sec {s.section || '?'})
                            {s.avg != null ? ` — ${s.avg}%` : ''}
                          </option>
                        ))}
                      </select>
                      {compareStudent && (
                        <button className="aspv-compare-view-btn" onClick={() => setActiveTab('compare')}>
                          View Comparison →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="aspv-charts-grid">
                    <div className="aspv-card">
                      <h3 className="aspv-card-title">Subject-wise Average</h3>
                      {subjectData.length === 0 ? (
                        <p className="aspv-no-data">No exam data for this student's class.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={Math.max(200, subjectData.length * 52)}>
                          <BarChart data={subjectData} layout="vertical"
                            margin={{ top: 4, right: 48, left: 8, bottom: 4 }} barCategoryGap="28%">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`}
                              tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="subject" width={110}
                              tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
                            {sectionAverageA != null && (
                              <ReferenceLine x={sectionAverageA} stroke={CLASS_AVG_COLOR} strokeDasharray="4 3" strokeWidth={1.5} />
                            )}
                            <Bar dataKey="percentage" name={selectedName} fill={STUDENT_COLOR} radius={[0, 6, 6, 0]}
                              label={{ position: 'right', formatter: (v) => `${v}%`, fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="aspv-card">
                      <h3 className="aspv-card-title">Progress Trend (by Exam Date)</h3>
                      {trendData.length === 0 ? (
                        <p className="aspv-no-data">No dated exams for this student's class.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <AreaChart data={trendData} margin={{ top: 16, right: 24, left: 0, bottom: 48 }}>
                            <defs>
                              <linearGradient id="aspvGrad1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={STUDENT_COLOR} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={STUDENT_COLOR} stopOpacity={0.01} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }}
                              angle={-35} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`}
                              tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            {sectionAverageA != null && (
                              <ReferenceLine y={sectionAverageA} stroke={CLASS_AVG_COLOR} strokeDasharray="5 4" strokeWidth={1.5}
                                label={{ value: `Avg ${sectionAverageA}%`, position: 'insideTopRight', fontSize: 11, fill: CLASS_AVG_COLOR, fontWeight: 600 }} />
                            )}
                            <Area type="monotone" dataKey="percentage" name={selectedName}
                              stroke={STUDENT_COLOR} strokeWidth={2.5} fill="url(#aspvGrad1)"
                              dot={{ r: 5, fill: STUDENT_COLOR, stroke: '#fff', strokeWidth: 2 }}
                              activeDot={{ r: 7 }} connectNulls />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {subjectData.length >= 3 && (
                      <div className="aspv-card aspv-card-full">
                        <h3 className="aspv-card-title">Subject Strength Radar</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart data={radarData} margin={{ top: 16, right: 40, left: 40, bottom: 16 }}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Radar name={selectedName} dataKey={selectedName} stroke={STUDENT_COLOR} fill={STUDENT_COLOR} fillOpacity={0.18} strokeWidth={2} />
                            {compareStudent && (
                              <Radar name={compareName} dataKey={compareName} stroke={COMPARE_COLOR} fill={COMPARE_COLOR} fillOpacity={0.18} strokeWidth={2} />
                            )}
                            <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                            <Tooltip content={<CustomTooltip />} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════ STUDENT COMPARE TAB ══════════════ */}
              {activeTab === 'compare' && selectedStudent && compareStudent && (
                <div className="aspv-compare">
                  <div className="aspv-compare-summary">
                    <div className="aspv-compare-card blue">
                      <span className="aspv-rank-badge large"
                        style={{ background: getRankColor(selectedSummary?.rank), color: selectedSummary?.rank <= 3 ? '#fff' : '#374151' }}>
                        #{selectedSummary?.rank || '—'}
                      </span>
                      <h3>{selectedName}</h3>
                      <p className="aspv-compare-class">
                        Class {selectedStudent.class}{selectedStudent.section ? `-${selectedStudent.section}` : ''}
                      </p>
                      <p className="aspv-compare-avg">{selectedSummary?.avg != null ? `${selectedSummary.avg}%` : 'No exams'}</p>
                      <p className="aspv-compare-exams">{selectedSummary?.count || 0} exam entries</p>
                    </div>

                    <div className="aspv-compare-vs">
                      <span>VS</span>
                      {selectedSummary?.avg != null && compareSummary?.avg != null && (
                        <p className={`aspv-winner ${selectedSummary.avg >= compareSummary.avg ? 'blue' : 'green'}`}>
                          {selectedSummary.avg >= compareSummary.avg ? selectedName : compareName} leads
                          by {Math.abs(selectedSummary.avg - compareSummary.avg).toFixed(1)}%
                        </p>
                      )}
                    </div>

                    <div className="aspv-compare-card green">
                      <span className="aspv-rank-badge large"
                        style={{ background: getRankColor(compareSummary?.rank), color: compareSummary?.rank <= 3 ? '#fff' : '#374151' }}>
                        #{compareSummary?.rank || '—'}
                      </span>
                      <h3>{compareName}</h3>
                      <p className="aspv-compare-class">
                        Class {compareStudent.class}{compareStudent.section ? `-${compareStudent.section}` : ''}
                      </p>
                      <p className="aspv-compare-avg">{compareSummary?.avg != null ? `${compareSummary.avg}%` : 'No exams'}</p>
                      <p className="aspv-compare-exams">{compareSummary?.count || 0} exam entries</p>
                    </div>
                  </div>

                  <div className="aspv-charts-grid">
                    <div className="aspv-card aspv-card-full">
                      <h3 className="aspv-card-title">Subject-wise Comparison</h3>
                      {mergedSubjectData.length === 0 ? (
                        <p className="aspv-no-data">No subject data available.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={Math.max(260, mergedSubjectData.length * 64)}>
                          <BarChart data={mergedSubjectData} layout="vertical"
                            margin={{ top: 8, right: 48, left: 8, bottom: 8 }} barCategoryGap="18%" barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`}
                              tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="subject" width={120}
                              tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                            <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                            <Bar dataKey={selectedName} fill={STUDENT_COLOR} radius={[0, 5, 5, 0]}
                              label={{ position: 'right', formatter: (v) => (v > 0 ? `${v}%` : ''), fontSize: 10, fill: '#475569' }} />
                            <Bar dataKey={compareName} fill={COMPARE_COLOR} radius={[0, 5, 5, 0]}
                              label={{ position: 'right', formatter: (v) => (v > 0 ? `${v}%` : ''), fontSize: 10, fill: '#475569' }} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="aspv-card aspv-card-full">
                      <h3 className="aspv-card-title">Progress Trend Comparison</h3>
                      {mergedTrendData.length === 0 ? (
                        <p className="aspv-no-data">No exam trend data available.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={280}>
                          <LineChart data={mergedTrendData} margin={{ top: 16, right: 24, left: 0, bottom: 48 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }}
                              angle={-35} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`}
                              tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                            <Line type="monotone" dataKey={selectedName} stroke={STUDENT_COLOR} strokeWidth={2.5}
                              dot={{ r: 5, fill: STUDENT_COLOR, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} connectNulls />
                            <Line type="monotone" dataKey={compareName} stroke={COMPARE_COLOR} strokeWidth={2.5}
                              dot={{ r: 5, fill: COMPARE_COLOR, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {radarData.length >= 3 && (
                      <div className="aspv-card aspv-card-full">
                        <h3 className="aspv-card-title">Subject Strength Radar</h3>
                        <ResponsiveContainer width="100%" height={320}>
                          <RadarChart data={radarData} margin={{ top: 16, right: 40, left: 40, bottom: 16 }}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Radar name={selectedName} dataKey={selectedName} stroke={STUDENT_COLOR} fill={STUDENT_COLOR} fillOpacity={0.2} strokeWidth={2} />
                            <Radar name={compareName}  dataKey={compareName}  stroke={COMPARE_COLOR}  fill={COMPARE_COLOR}  fillOpacity={0.2} strokeWidth={2} />
                            <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                            <Tooltip content={<CustomTooltip />} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'individual' && !selectedStudent && (
                <div className="aspv-placeholder">
                  <div className="aspv-placeholder-icon">👆</div>
                  <p>Select a student from the Overview tab to view their progress.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
