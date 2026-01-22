import express from 'express';
import { getStudentReport, getStaffReport, getTransportReport } from './report.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Report Routes
 * Base path: /api/admin/reports
 */

// GET /api/admin/reports/students - Generate student report
router.get('/students', authenticate, getStudentReport);

// GET /api/admin/reports/staff - Generate staff report
router.get('/staff', authenticate, getStaffReport);

// GET /api/admin/reports/transport - Generate transport maintenance report
router.get('/transport', authenticate, getTransportReport);

export default router;
