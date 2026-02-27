import pool from '../../config/mysql.config.js';

/**
 * Get all marks, optionally filtered by student_id or class name.
 * Reads from the student_marks table that faculty staff populate.
 */
export const findAllMarks = async ({ studentId, className } = {}) => {
  let query = `
    SELECT
      sm.id,
      sm.student_id,
      sm.staff_id,
      sm.subject,
      sm.exam_type,
      sm.marks        AS obtained_marks,
      sm.max_marks,
      sm.exam_date,
      sm.created_at,
      sm.updated_at,
      s.name          AS student_name,
      s.class         AS class_name,
      s.section       AS section_name
    FROM student_marks sm
    JOIN students s ON s.student_id = sm.student_id
  `;
  const params = [];
  const conditions = [];

  if (studentId) {
    conditions.push('sm.student_id = ?');
    params.push(studentId);
  }
  if (className) {
    conditions.push('s.class = ?');
    params.push(className);
  }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY sm.exam_date ASC, sm.subject ASC';

  const [rows] = await pool.execute(query, params);
  return rows;
};

/**
 * Get marks grouped by student for a given class (and optionally section).
 * Returns one row per student with their average percentage.
 */
export const findMarksSummaryByClass = async (className, sectionName = null) => {
  let query = `
    SELECT
      sm.student_id,
      s.name     AS student_name,
      s.class    AS class_name,
      s.section  AS section_name,
      COUNT(sm.id)                                              AS exam_count,
      ROUND(AVG((sm.marks / sm.max_marks) * 100), 1)           AS avg_pct,
      SUM(sm.marks)                                            AS total_obtained,
      SUM(sm.max_marks)                                        AS total_max
    FROM student_marks sm
    JOIN students s ON s.student_id = sm.student_id
    WHERE s.class = ?
  `;
  const params = [className];

  if (sectionName) {
    query += ' AND s.section = ?';
    params.push(sectionName);
  }

  query += ' GROUP BY sm.student_id, s.name, s.class, s.section ORDER BY avg_pct DESC';

  const [rows] = await pool.execute(query, params);
  return rows;
};

/**
 * Get per-exam timeline for a class — each exam date+type+subject as one point
 * with the class average score on that exam.
 */
export const findExamTimelineByClass = async (className) => {
  const [rows] = await pool.execute(
    `SELECT
       sm.exam_date,
       sm.exam_type,
       sm.subject,
       sm.max_marks,
       ROUND(AVG((sm.marks / sm.max_marks) * 100), 1) AS avg_pct,
       COUNT(sm.id)                                    AS student_count
     FROM student_marks sm
     JOIN students s ON s.student_id = sm.student_id
     WHERE s.class = ?
     GROUP BY sm.exam_date, sm.exam_type, sm.subject, sm.max_marks
     ORDER BY sm.exam_date ASC, sm.exam_type ASC`,
    [className]
  );
  return rows;
};
