import express from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} from './student.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Student Routes
 * Base path: /api/students
 * All routes require authentication
 */

// GET /api/students - Get all students
router.get('/', authenticate, getAllStudents);

// GET /api/students/:id - Get student by ID
router.get('/:id', authenticate, getStudentById);

// POST /api/students - Create new student
router.post('/', authenticate, createStudent);

// PUT /api/students/:id - Update student
router.put('/:id', authenticate, updateStudent);

// DELETE /api/students/:id - Delete student
router.delete('/:id', authenticate, deleteStudent);

export default router;

