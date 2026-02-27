import axios from 'axios';
import { getToken } from '../utils/auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Get all marks for a student (by student_id string).
 * Returns array of { student_id, subject, exam_type, obtained_marks, max_marks, exam_date, ... }
 */
export const getMarksByStudent = async (studentId) => {
  try {
    const res = await apiClient.get('/api/marks', { params: { studentId } });
    return res.data.data || [];
  } catch (err) {
    if (err.response) throw new Error(err.response.data.message || 'Failed to fetch marks');
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get marks summary for a class+section.
 * Returns array of { student_id, student_name, avg_pct, exam_count, total_obtained, total_max }
 */
export const getMarksSummary = async (className, section = null) => {
  try {
    const params = { class: className };
    if (section) params.section = section;
    const res = await apiClient.get('/api/marks/summary', { params });
    return res.data.data || [];
  } catch (err) {
    if (err.response) throw new Error(err.response.data.message || 'Failed to fetch marks summary');
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get exam timeline for a class.
 * Returns array of { exam_date, exam_type, subject, max_marks, avg_pct, student_count }
 * sorted by exam_date ASC.
 */
export const getExamTimeline = async (className) => {
  try {
    const res = await apiClient.get('/api/marks/timeline', { params: { class: className } });
    return res.data.data || [];
  } catch (err) {
    if (err.response) throw new Error(err.response.data.message || 'Failed to fetch exam timeline');
    throw new Error('Network error. Please check your connection.');
  }
};
