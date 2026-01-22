import axios from 'axios';
import { getToken } from '../utils/auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Report Service - API calls for report generation
 */

/**
 * Generate student report
 * @param {Object} filters - Filter options (class, section, status)
 * @returns {Promise<Object>} Report data
 */
export const generateStudentReport = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.class) params.append('class', filters.class);
    if (filters.section) params.append('section', filters.section);
    if (filters.status) params.append('status', filters.status);

    const response = await apiClient.get(`/api/admin/reports/students?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to generate student report');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Generate staff report
 * @param {Object} filters - Filter options (designation, status, class, section)
 * @returns {Promise<Object>} Report data
 */
export const generateStaffReport = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.designation) params.append('designation', filters.designation);
    if (filters.status) params.append('status', filters.status);
    if (filters.class) params.append('class', filters.class);
    if (filters.section) params.append('section', filters.section);

    const response = await apiClient.get(`/api/admin/reports/staff?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to generate staff report');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Generate transport maintenance report
 * @param {Object} filters - Filter options (status)
 * @returns {Promise<Object>} Report data
 */
export const generateTransportReport = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);

    const response = await apiClient.get(`/api/admin/reports/transport?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to generate transport report');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export default {
  generateStudentReport,
  generateStaffReport,
  generateTransportReport
};
