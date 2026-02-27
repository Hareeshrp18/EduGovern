import pool from '../../config/mysql.config.js';
import bcrypt from 'bcrypt';

/**
 * Faculty Model - Database operations for faculty
 * Staff ID format: staff100@sks, staff101@sks, ... (only the number changes)
 * Staff password: ddmmyy (date of birth), bcrypt-hashed and stored in staff_password
 */

/**
 * Get max staff number from existing staff_id values (staff{N}@sks)
 * @returns {Promise<number>} Max number used, or 99 if none (next will be 100)
 */
const getMaxStaffNumber = async () => {
  const [rows] = await pool.execute(
    `SELECT staff_id FROM faculty WHERE staff_id IS NOT NULL AND staff_id REGEXP '^staff[0-9]+@sks$'`
  );
  if (!rows.length) return 99;
  const numbers = rows
    .map((r) => {
      const m = (r.staff_id || '').match(/^staff(\d+)@sks$/);
      return m ? parseInt(m[1], 10) : NaN;
    })
    .filter((n) => !isNaN(n));
  return numbers.length ? Math.max(...numbers) : 99;
};

/**
 * Format date as ddmmyy (date of birth format for staff password)
 * @param {string} dateStr - ISO date YYYY-MM-DD
 * @returns {string|null} ddmmyy or null
 */
const formatDdmmyy = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${d}${mo}${y.slice(-2)}`;
};

/**
 * Get all faculty
 * @returns {Promise<Array>} List of all faculty
 */
export const findAll = async () => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM faculty ORDER BY staff_id ASC'
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find faculty by staff_id
 * @param {string} staffId - staff_id (e.g. staff100@sks)
 * @returns {Promise<Object|null>} Faculty record or null if not found
 */
export const findById = async (staffId) => {
  try {
    const s = staffId != null && staffId !== '' ? String(staffId).trim() : '';
    if (!s) return null;
    const [rows] = await pool.execute(
      'SELECT * FROM faculty WHERE staff_id = ? LIMIT 1',
      [s]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find faculty by class and section
 * @param {string} className - Class name
 * @param {string} section - Section
 * @returns {Promise<Array>} List of faculty
 */
export const findByClassAndSection = async (className, section) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM faculty WHERE class = ? AND section = ? ORDER BY staff_id ASC',
      [className, section]
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Create a new faculty member
 * Assigns staff_id (staff{N}@sks) and staff_password (bcrypt hash of ddmmyy from date_of_birth).
 * @param {Object} facultyData - Faculty data (date_of_birth required for password)
 * @returns {Promise<Object>} Created faculty record
 */
export const create = async (facultyData) => {
  const {
    staff_name,
    date_of_birth,
    designation,
    experience,
    contact,
    email,
    address,
    salary,
    class: className,
    section,
    qualification,
    joining_date,
    photo,
    status = 'Active'
  } = facultyData;

  const plainPassword = formatDdmmyy(date_of_birth || '');
  const staffPasswordHash = plainPassword
    ? await bcrypt.hash(plainPassword, 10)
    : null;

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const maxNum = await getMaxStaffNumber();
      const nextNum = maxNum + 1;
      const staffId = `staff${nextNum}@sks`;

      await pool.execute(
        `INSERT INTO faculty (
          staff_id, staff_password, staff_name, date_of_birth, designation, experience, contact, email,
          address, salary, class, section, qualification, joining_date, photo, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          staffId,
          staffPasswordHash,
          staff_name,
          date_of_birth || null,
          designation || null,
          experience || null,
          contact || null,
          email || null,
          address || null,
          salary || null,
          className || null,
          section || null,
          qualification || null,
          joining_date || null,
          photo || null,
          status
        ]
      );

      return await findById(staffId);
    } catch (error) {
      lastError = error;
      if (error.code === 'ER_DUP_ENTRY') {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('email')) throw new Error('Email already exists');
        if (msg.includes('staff_id')) continue; // retry with next number
        throw new Error('Email already exists');
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }
  if (lastError?.code === 'ER_DUP_ENTRY') {
    throw new Error('Could not generate unique staff ID. Please try again.');
  }
  throw new Error(lastError ? `Database error: ${lastError.message}` : 'Failed to create faculty');
};

/**
 * Update faculty by staff_id
 * @param {string} staffId - staff_id (e.g. staff100@sks)
 * @param {Object} facultyData - Updated faculty data
 * @returns {Promise<Object>} Updated faculty record
 */
export const update = async (staffId, facultyData) => {
  try {
    const sid = staffId != null && staffId !== '' ? String(staffId).trim() : '';
    if (!sid) throw new Error('Invalid staff_id');
    const {
      staff_name,
      date_of_birth,
      designation,
      experience,
      contact,
      email,
      address,
      salary,
      class: className,
      section,
      qualification,
      joining_date,
      photo,
      status
    } = facultyData;

    const [updateResult] = await pool.execute(
      `UPDATE faculty SET
        staff_name = ?, date_of_birth = ?, designation = ?, experience = ?,
        contact = ?, email = ?, address = ?, salary = ?,
        class = ?, section = ?, qualification = ?, joining_date = ?, photo = ?, status = ?
      WHERE staff_id = ?`,
      [
        staff_name,
        date_of_birth || null,
        designation || null,
        experience || null,
        contact || null,
        email || null,
        address || null,
        salary || null,
        className || null,
        section || null,
        qualification || null,
        joining_date || null,
        photo || null,
        status,
        sid
      ]
    );
    if (updateResult.affectedRows === 0) throw new Error('Faculty not found');

    return await findById(sid);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Email already exists');
    }
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Delete faculty by staff_id
 * @param {string} staffId - staff_id (e.g. staff100@sks)
 * @returns {Promise<boolean>} Success status
 */
export const remove = async (staffId) => {
  try {
    const sid = staffId != null && staffId !== '' ? String(staffId).trim() : '';
    if (!sid) throw new Error('Invalid staff_id');
    const [result] = await pool.execute(
      'DELETE FROM faculty WHERE staff_id = ?',
      [sid]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};
