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
 * Request Service - API calls for request operations
 */

/**
 * Get all requests
 * @param {Object} filters - Optional filters (status, request_type, requester_type, requester_id)
 * @returns {Promise<Array>} List of requests
 */
export const getAllRequests = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/api/admin/requests?${queryString}` : '/api/admin/requests';
    const response = await apiClient.get(url);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch requests');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get request by ID
 * @param {number} id - Request ID
 * @returns {Promise<Object>} Request data
 */
export const getRequestById = async (id) => {
  try {
    const response = await apiClient.get(`/api/admin/requests/${id}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch request');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Create a new request
 * @param {Object} requestData - Request data
 * @returns {Promise<Object>} Created request
 */
export const createRequest = async (requestData) => {
  try {
    const response = await apiClient.post('/api/admin/requests', requestData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to create request');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Update request status (approve/reject)
 * @param {number} id - Request ID
 * @param {Object} updateData - Update data (status, admin_comment)
 * @returns {Promise<Object>} Updated request
 */
export const updateRequestStatus = async (id, updateData) => {
  try {
    const response = await apiClient.patch(`/api/admin/requests/${id}/status`, updateData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update request status');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Update request
 * @param {number} id - Request ID
 * @param {Object} requestData - Updated request data
 * @returns {Promise<Object>} Updated request
 */
export const updateRequest = async (id, requestData) => {
  try {
    const response = await apiClient.put(`/api/admin/requests/${id}`, requestData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update request');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Delete request
 * @param {number} id - Request ID
 * @returns {Promise<void>}
 */
export const deleteRequest = async (id) => {
  try {
    await apiClient.delete(`/api/admin/requests/${id}`);
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete request');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get request statistics
 * @returns {Promise<Object>} Request statistics
 */
export const getRequestStatistics = async () => {
  try {
    const response = await apiClient.get('/api/admin/requests/statistics');
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch statistics');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export default {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  updateRequest,
  deleteRequest,
  getRequestStatistics
};
