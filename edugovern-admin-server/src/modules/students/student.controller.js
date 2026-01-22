import * as studentService from './student.service.js';

/**
 * Student Controller - Request/response handling for student operations
 */

/**
 * Get all students
 * GET /api/students
 */
export const getAllStudents = async (req, res) => {
  try {
    const students = await studentService.getAllStudents();
    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch students'
    });
  }
};

/**
 * Get student by ID
 * GET /api/students/:id
 */
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await studentService.getStudentById(parseInt(id));
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || 'Student not found'
    });
  }
};

/**
 * Create a new student
 * POST /api/students
 */
export const createStudent = async (req, res) => {
  try {
    const student = await studentService.createStudent(req.body);
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create student'
    });
  }
};

/**
 * Update student
 * PUT /api/students/:id
 */
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await studentService.updateStudent(parseInt(id), req.body);
    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update student'
    });
  }
};

/**
 * Delete student
 * DELETE /api/students/:id
 */
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    await studentService.deleteStudent(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete student'
    });
  }
};

