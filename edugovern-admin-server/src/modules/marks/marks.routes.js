import express from 'express';
import { getMarks, getMarksSummary, getExamTimeline } from './marks.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/marks?studentId=1@sks&class=10
router.get('/', authenticate, getMarks);

// GET /api/marks/summary?class=10&section=B
router.get('/summary', authenticate, getMarksSummary);

// GET /api/marks/timeline?class=10
router.get('/timeline', authenticate, getExamTimeline);

export default router;
