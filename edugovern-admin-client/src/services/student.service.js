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
 * Student Service - API calls for student operations
 */

/**
 * Get all students
 * @returns {Promise<Array>} List of students
 */
export const getAllStudents = async () => {
  try {
    const response = await apiClient.get('/api/students');
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch students');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get student by ID
 * @param {number} id - Student ID
 * @returns {Promise<Object>} Student data
 */
export const getStudentById = async (id) => {
  try {
    const response = await apiClient.get(`/api/students/${id}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch student');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Create a new student
 * @param {Object} studentData - Student data
 * @returns {Promise<Object>} Created student
 */
export const createStudent = async (studentData) => {
  try {
    const response = await apiClient.post('/api/students', studentData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to create student');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Update student
 * @param {number} id - Student ID
 * @param {Object} studentData - Updated student data
 * @returns {Promise<Object>} Updated student
 */
export const updateStudent = async (id, studentData) => {
  try {
    const response = await apiClient.put(`/api/students/${id}`, studentData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update student');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Delete student
 * @param {number} id - Student ID
 * @returns {Promise<void>}
 */
export const deleteStudent = async (id) => {
  try {
    await apiClient.delete(`/api/students/${id}`);
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete student');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export default {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};

