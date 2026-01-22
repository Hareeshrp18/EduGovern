import express from 'express';
import {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
} from './faculty.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Faculty Routes
 * Base path: /api/faculty
 * All routes require authentication
 */

// GET /api/faculty - Get all faculty
router.get('/', authenticate, getAllFaculty);

// GET /api/faculty/:id - Get faculty by ID
router.get('/:id', authenticate, getFacultyById);

// POST /api/faculty - Create new faculty
router.post('/', authenticate, createFaculty);

// PUT /api/faculty/:id - Update faculty
router.put('/:id', authenticate, updateFaculty);

// DELETE /api/faculty/:id - Delete faculty
router.delete('/:id', authenticate, deleteFaculty);

export default router;
