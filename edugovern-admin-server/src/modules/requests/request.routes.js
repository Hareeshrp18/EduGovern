import express from 'express';
import {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  updateRequest,
  deleteRequest,
  getRequestStatistics
} from './request.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Request Routes
 * Base path: /api/admin/requests
 * All routes require authentication
 */

// GET /api/admin/requests/statistics - Get request statistics
router.get('/statistics', authenticate, getRequestStatistics);

// GET /api/admin/requests - Get all requests
router.get('/', authenticate, getAllRequests);

// GET /api/admin/requests/:id - Get request by ID
router.get('/:id', authenticate, getRequestById);

// POST /api/admin/requests - Create new request
router.post('/', authenticate, createRequest);

// PATCH /api/admin/requests/:id/status - Update request status (approve/reject)
router.patch('/:id/status', authenticate, updateRequestStatus);

// PUT /api/admin/requests/:id - Update request
router.put('/:id', authenticate, updateRequest);

// DELETE /api/admin/requests/:id - Delete request
router.delete('/:id', authenticate, deleteRequest);

export default router;
