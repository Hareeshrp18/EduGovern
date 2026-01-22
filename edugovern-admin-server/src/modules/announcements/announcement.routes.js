import express from 'express';
import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from './announcement.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Announcement Routes
 * Base path: /api/announcements
 * All routes require authentication
 */

// GET /api/announcements - Get all announcements
router.get('/', authenticate, getAllAnnouncements);

// GET /api/announcements/:id - Get announcement by ID
router.get('/:id', authenticate, getAnnouncementById);

// POST /api/announcements - Create new announcement
router.post('/', authenticate, createAnnouncement);

// PUT /api/announcements/:id - Update announcement
router.put('/:id', authenticate, updateAnnouncement);

// DELETE /api/announcements/:id - Delete announcement
router.delete('/:id', authenticate, deleteAnnouncement);

export default router;
