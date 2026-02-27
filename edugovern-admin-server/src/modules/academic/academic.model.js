import pool from '../../config/mysql.config.js';

/** Order: PreKG, LKG, UKG, then 1..12. Used for sorting classes. */
const getClassOrder = (name) => {
  if (!name || typeof name !== 'string') return 999;
  const n = name.trim();
  if (/^PreKG$/i.test(n)) return 0;
  if (/^LKG$/i.test(n)) return 1;
  if (/^UKG$/i.test(n)) return 2;
  const num = parseInt(n, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= 12) return 3 + num;
  return 999;
};

/** Numeric class cannot be above 12. Allowed: PreKG, LKG, UKG and 1–12. */
export const validateClassName = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) return;
  const n = name.trim();
  if (/^PreKG$/i.test(n) || /^LKG$/i.test(n) || /^UKG$/i.test(n)) return;
  const num = parseInt(n, 10);
  if (!Number.isNaN(num) && num > 12) {
    throw new Error('Class cannot be above 12. Allowed: PreKG, LKG, UKG and 1 to 12.');
  }
};

/** Classes - ordered: PreKG, LKG, UKG, then 1, 2, ... 12 */
export const findAllClasses = async () => {
  const [rows] = await pool.execute('SELECT * FROM classes ORDER BY name ASC');
  return rows.sort((a, b) => getClassOrder(a.name) - getClassOrder(b.name));
};

export const findClassById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM classes WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
};

export const createClass = async (data) => {
  validateClassName(data.name);
  const [r] = await pool.execute(
    'INSERT INTO classes (name, display_order) VALUES (?, 0)',
    [data.name]
  );
  return await findClassById(r.insertId);
};

export const updateClass = async (id, data) => {
  validateClassName(data.name);
  await pool.execute('UPDATE classes SET name = ? WHERE id = ?', [data.name, id]);
  return await findClassById(id);
};

export const deleteClass = async (id) => {
  const [r] = await pool.execute('DELETE FROM classes WHERE id = ?', [id]);
  return r.affectedRows > 0;
};

/** Sections (per class) */
export const findAllSections = async (classId = null) => {
  if (classId) {
    const [rows] = await pool.execute(
      `SELECT s.*, c.name AS class_name FROM sections s
       JOIN classes c ON c.id = s.class_id
       WHERE s.class_id = ? ORDER BY s.name ASC`,
      [classId]
    );
    return rows;
  }
  const [rows] = await pool.execute(
    `SELECT s.*, c.name AS class_name FROM sections s
     JOIN classes c ON c.id = s.class_id
     ORDER BY c.name ASC, s.name ASC`
  );
  return rows.sort((a, b) => getClassOrder(a.class_name) - getClassOrder(b.class_name));
};

export const findSectionById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT s.*, c.name AS class_name FROM sections s
     JOIN classes c ON c.id = s.class_id WHERE s.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const createSection = async (data) => {
  const [r] = await pool.execute(
    'INSERT INTO sections (name, class_id, display_order) VALUES (?, ?, 0)',
    [data.name, data.class_id]
  );
  return await findSectionById(r.insertId);
};

export const updateSection = async (id, data) => {
  await pool.execute(
    'UPDATE sections SET name = ?, class_id = ? WHERE id = ?',
    [data.name, data.class_id, id]
  );
  return await findSectionById(id);
};

export const deleteSection = async (id) => {
  const [r] = await pool.execute('DELETE FROM sections WHERE id = ?', [id]);
  return r.affectedRows > 0;
};

/** Subjects (per class) */
export const findAllSubjects = async (classId = null) => {
  if (classId) {
    const [rows] = await pool.execute(
      `SELECT s.*, c.name AS class_name FROM subjects s
       JOIN classes c ON c.id = s.class_id
       WHERE s.class_id = ? ORDER BY s.name ASC`,
      [classId]
    );
    return rows;
  }
  const [rows] = await pool.execute(
    `SELECT s.*, c.name AS class_name FROM subjects s
     JOIN classes c ON c.id = s.class_id
     ORDER BY c.name ASC, s.name ASC`
  );
  return rows.sort((a, b) => getClassOrder(a.class_name) - getClassOrder(b.class_name));
};

export const findSubjectById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT s.*, c.name AS class_name FROM subjects s
     JOIN classes c ON c.id = s.class_id WHERE s.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const createSubject = async (data) => {
  const [r] = await pool.execute(
    'INSERT INTO subjects (name, class_id, display_order) VALUES (?, ?, 0)',
    [data.name, data.class_id]
  );
  return await findSubjectById(r.insertId);
};

export const updateSubject = async (id, data) => {
  await pool.execute(
    'UPDATE subjects SET name = ?, class_id = ? WHERE id = ?',
    [data.name, data.class_id, id]
  );
  return await findSubjectById(id);
};

export const deleteSubject = async (id) => {
  const [r] = await pool.execute('DELETE FROM subjects WHERE id = ?', [id]);
  return r.affectedRows > 0;
};

/** Exams (per class, optionally per subject) */
export const findAllExams = async (classId = null) => {
  let query = `
    SELECT e.*, c.name AS class_name, s.name AS subject_name
    FROM exams e
    JOIN classes c ON c.id = e.class_id
    LEFT JOIN subjects s ON s.id = e.subject_id
  `;
  const params = [];
  
  if (classId) {
    query += ' WHERE e.class_id = ?';
    params.push(classId);
  }
  
  query += ' ORDER BY c.name ASC, e.exam_date DESC, e.exam_type ASC';
  
  const [rows] = await pool.execute(query, params);
  return rows.sort((a, b) => getClassOrder(a.class_name) - getClassOrder(b.class_name));
};

export const findExamById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT e.*, c.name AS class_name, s.name AS subject_name
     FROM exams e
     JOIN classes c ON c.id = e.class_id
     LEFT JOIN subjects s ON s.id = e.subject_id
     WHERE e.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const createExam = async (data) => {
  const {
    class_id,
    subject_id = null,
    exam_type = 'Assignment',
    exam_date = null,
    max_marks = 100.00,
    description = null
  } = data;
  
  const [r] = await pool.execute(
    `INSERT INTO exams (class_id, subject_id, exam_type, exam_date, max_marks, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [class_id, subject_id, exam_type, exam_date, max_marks, description]
  );
  return await findExamById(r.insertId);
};

export const updateExam = async (id, data) => {
  const {
    class_id,
    subject_id = null,
    exam_type = 'Assignment',
    exam_date = null,
    max_marks,
    description = null
  } = data;
  
  await pool.execute(
    `UPDATE exams 
     SET class_id = ?, subject_id = ?, exam_type = ?, exam_date = ?, max_marks = ?, description = ?
     WHERE id = ?`,
    [class_id, subject_id, exam_type, exam_date, max_marks, description, id]
  );
  return await findExamById(id);
};

export const deleteExam = async (id) => {
  const [r] = await pool.execute('DELETE FROM exams WHERE id = ?', [id]);
  return r.affectedRows > 0;
};
