import express from 'express';
import { login } from './admin.controller.js';
import { forgotPassword, resetPassword } from './passwordReset.controller.js';
import { getDashboardStats } from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Admin Routes
 * Base path: /api/admin
 */

// POST /api/admin/login - Admin login endpoint
router.post('/login', login);

// POST /api/admin/forgot-password - Forgot password endpoint
router.post('/forgot-password', forgotPassword);

// POST /api/admin/reset-password - Reset password endpoint
router.post('/reset-password', resetPassword);

// GET /api/admin/dashboard/stats - Get dashboard statistics (requires authentication)
router.get('/dashboard/stats', authenticate, getDashboardStats);

export default router;

