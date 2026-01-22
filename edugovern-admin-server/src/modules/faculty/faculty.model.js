import pool from '../../config/mysql.config.js';

/**
 * Faculty Model - Database operations for faculty
 */

/**
 * Get all faculty
 * @returns {Promise<Array>} List of all faculty
 */
export const findAll = async () => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM faculty ORDER BY created_at DESC'
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find faculty by ID
 * @param {number} id - Faculty ID
 * @returns {Promise<Object|null>} Faculty record or null if not found
 */
export const findById = async (id) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM faculty WHERE id = ?',
      [id]
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
      'SELECT * FROM faculty WHERE class = ? AND section = ? ORDER BY created_at DESC',
      [className, section]
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Create a new faculty member
 * @param {Object} facultyData - Faculty data
 * @returns {Promise<Object>} Created faculty record
 */
export const create = async (facultyData) => {
  try {
    const {
      name,
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

    const [result] = await pool.execute(
      `INSERT INTO faculty (
        name, date_of_birth, designation, experience, contact, email, 
        address, salary, class, section, qualification, joining_date, photo, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
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

    return await findById(result.insertId);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Email already exists');
    }
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Update faculty by ID
 * @param {number} id - Faculty ID
 * @param {Object} facultyData - Updated faculty data
 * @returns {Promise<Object>} Updated faculty record
 */
export const update = async (id, facultyData) => {
  try {
    const {
      name,
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

    await pool.execute(
      `UPDATE faculty SET
        name = ?, date_of_birth = ?, designation = ?, experience = ?,
        contact = ?, email = ?, address = ?, salary = ?,
        class = ?, section = ?, qualification = ?, joining_date = ?, photo = ?, status = ?
      WHERE id = ?`,
      [
        name,
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
        id
      ]
    );

    return await findById(id);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Email already exists');
    }
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Delete faculty by ID
 * @param {number} id - Faculty ID
 * @returns {Promise<boolean>} Success status
 */
export const remove = async (id) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM faculty WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};
