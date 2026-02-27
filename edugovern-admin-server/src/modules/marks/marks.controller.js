import { findAllMarks, findMarksSummaryByClass, findExamTimelineByClass } from './marks.model.js';

/** GET /api/marks?studentId=&class= */
export const getMarks = async (req, res) => {
  try {
    const { studentId, class: className } = req.query;
    const marks = await findAllMarks({ studentId, className });
    res.json({ success: true, data: marks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/marks/summary?class=10&section=B */
export const getMarksSummary = async (req, res) => {
  try {
    const { class: className, section } = req.query;
    if (!className) {
      return res.status(400).json({ success: false, message: 'class query param is required' });
    }
    const summary = await findMarksSummaryByClass(className, section || null);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/marks/timeline?class=10 */
export const getExamTimeline = async (req, res) => {
  try {
    const { class: className } = req.query;
    if (!className) {
      return res.status(400).json({ success: false, message: 'class query param is required' });
    }
    const timeline = await findExamTimelineByClass(className);
    res.json({ success: true, data: timeline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
