import * as studentModel from './student.model.js';

/**
 * Student Service - Business logic for student operations
 */

/**
 * Get all students
 * @returns {Promise<Array>} List of students
 */
export const getAllStudents = async () => {
  return await studentModel.findAll();
};

/**
 * Get student by ID
 * @param {number} id - Student ID
 * @returns {Promise<Object>} Student record
 */
export const getStudentById = async (id) => {
  const student = await studentModel.findById(id);
  if (!student) {
    throw new Error('Student not found');
  }
  return student;
};

/**
 * Create a new student
 * @param {Object} studentData - Student data
 * @returns {Promise<Object>} Created student
 */
export const createStudent = async (studentData) => {
  // Validate required fields
  if (!studentData.student_id || !studentData.name) {
    throw new Error('Student ID and Name are required');
  }

  // Check if student_id already exists
  const existing = await studentModel.findByStudentId(studentData.student_id);
  if (existing) {
    throw new Error('Student ID already exists');
  }

  return await studentModel.create(studentData);
};

/**
 * Update student
 * @param {number} id - Student ID
 * @param {Object} studentData - Updated student data
 * @returns {Promise<Object>} Updated student
 */
export const updateStudent = async (id, studentData) => {
  // Check if student exists
  const existing = await studentModel.findById(id);
  if (!existing) {
    throw new Error('Student not found');
  }

  // Don't allow updating student_id
  delete studentData.student_id;

  return await studentModel.update(id, studentData);
};

/**
 * Delete student
 * @param {number} id - Student ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteStudent = async (id) => {
  const student = await studentModel.findById(id);
  if (!student) {
    throw new Error('Student not found');
  }

  return await studentModel.remove(id);
};

