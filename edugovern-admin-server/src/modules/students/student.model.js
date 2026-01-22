import pool from '../../config/mysql.config.js';

/**
 * Student Model - Database operations for students
 */

/**
 * Get all students
 * @returns {Promise<Array>} List of all students
 */
export const findAll = async () => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM students ORDER BY created_at DESC'
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find student by ID
 * @param {number} id - Student ID
 * @returns {Promise<Object|null>} Student record or null if not found
 */
export const findById = async (id) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find student by student_id
 * @param {string} studentId - Student ID
 * @returns {Promise<Object|null>} Student record or null if not found
 */
export const findByStudentId = async (studentId) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE student_id = ?',
      [studentId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Create a new student
 * @param {Object} studentData - Student data
 * @returns {Promise<Object>} Created student record
 */
export const create = async (studentData) => {
  try {
    const {
      student_id,
      name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      class: className,
      section,
      academic_year,
      admission_date,
      blood_group,
      father_name,
      mother_name,
      primary_contact,
      secondary_contact,
      aadhar_no,
      annual_income,
      parent_name,
      parent_phone,
      parent_email,
      photo,
      status = 'Active'
    } = studentData;

    const [result] = await pool.execute(
      `INSERT INTO students (
        student_id, name, email, phone, date_of_birth, gender, address,
        class, section, academic_year, admission_date, blood_group,
        father_name, mother_name, primary_contact, secondary_contact,
        aadhar_no, annual_income, parent_name, parent_phone, parent_email, photo, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id,
        name,
        email || null,
        phone || null,
        date_of_birth || null,
        gender || null,
        address || null,
        className || null,
        section || null,
        academic_year || null,
        admission_date || null,
        blood_group || null,
        father_name || null,
        mother_name || null,
        primary_contact || null,
        secondary_contact || null,
        aadhar_no || null,
        annual_income || null,
        parent_name || null,
        parent_phone || null,
        parent_email || null,
        photo || null,
        status
      ]
    );

    return await findById(result.insertId);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Student ID or Email already exists');
    }
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Update student by ID
 * @param {number} id - Student ID
 * @param {Object} studentData - Updated student data
 * @returns {Promise<Object>} Updated student record
 */
export const update = async (id, studentData) => {
  try {
    const {
      name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      class: className,
      section,
      academic_year,
      admission_date,
      blood_group,
      father_name,
      mother_name,
      primary_contact,
      secondary_contact,
      aadhar_no,
      annual_income,
      parent_name,
      parent_phone,
      parent_email,
      photo,
      status
    } = studentData;

    await pool.execute(
      `UPDATE students SET
        name = ?, email = ?, phone = ?, date_of_birth = ?, gender = ?,
        address = ?, class = ?, section = ?, academic_year = ?,
        admission_date = ?, blood_group = ?, father_name = ?, mother_name = ?,
        primary_contact = ?, secondary_contact = ?, aadhar_no = ?,
        annual_income = ?, parent_name = ?, parent_phone = ?,
        parent_email = ?, photo = ?, status = ?
      WHERE id = ?`,
      [
        name,
        email || null,
        phone || null,
        date_of_birth || null,
        gender || null,
        address || null,
        className || null,
        section || null,
        academic_year || null,
        admission_date || null,
        blood_group || null,
        father_name || null,
        mother_name || null,
        primary_contact || null,
        secondary_contact || null,
        aadhar_no || null,
        annual_income || null,
        parent_name || null,
        parent_phone || null,
        parent_email || null,
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
 * Delete student by ID
 * @param {number} id - Student ID
 * @returns {Promise<boolean>} Success status
 */
export const remove = async (id) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM students WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

