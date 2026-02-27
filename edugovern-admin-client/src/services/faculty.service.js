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
 * Faculty Service - API calls for faculty operations
 */

/**
 * Get all faculty
 * @param {string} className - Optional class filter
 * @param {string} section - Optional section filter
 * @returns {Promise<Array>} List of faculty
 */
export const getAllFaculty = async (className = null, section = null) => {
  try {
    let url = '/api/faculty';
    const params = new URLSearchParams();
    if (className) params.append('class', className);
    if (section) params.append('section', section);
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await apiClient.get(url);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch faculty');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get faculty by staff_id
 * @param {string} staffId - staff_id (e.g. staff100@sks)
 * @returns {Promise<Object>} Faculty data
 */
export const getFacultyById = async (staffId) => {
  try {
    const response = await apiClient.get(`/api/faculty/${encodeURIComponent(staffId)}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch faculty');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Create a new faculty member
 * @param {Object} facultyData - Faculty data
 * @returns {Promise<Object>} Created faculty
 */
export const createFaculty = async (facultyData) => {
  try {
    const response = await apiClient.post('/api/faculty', facultyData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to create faculty');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Update faculty
 * @param {string} staffId - staff_id (e.g. staff100@sks)
 * @param {Object} facultyData - Updated faculty data
 * @returns {Promise<Object>} Updated faculty
 */
export const updateFaculty = async (staffId, facultyData) => {
  try {
    const response = await apiClient.put(`/api/faculty/${encodeURIComponent(staffId)}`, facultyData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update faculty');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Delete faculty
 * @param {string} staffId - staff_id (e.g. staff100@sks)
 * @returns {Promise<void>}
 */
export const deleteFaculty = async (staffId) => {
  try {
    await apiClient.delete(`/api/faculty/${encodeURIComponent(staffId)}`);
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete faculty');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export default {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
};
