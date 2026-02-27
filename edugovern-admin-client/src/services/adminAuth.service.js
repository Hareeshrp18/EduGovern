import axios from 'axios';
import { setToken, removeToken } from '../utils/auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/* Admin Authentication Service Handles API calls for admin authentication*/

/**
 * Login admin
 * @param {string} adminId - Admin ID
 * @param {string} password - Password
 * @returns {Promise<Object>} Response data with token and admin info
 */
export const login = async (adminId, password) => {
  try {
    const response = await apiClient.post('/api/admin/login', {
      admin_id: adminId,
      password: password
    });

    if (response.data.success && response.data.data.token) {
      // Store token in sessionStorage (cleared when tab closes)
      setToken(response.data.data.token);
      return response.data.data;
    }

    throw new Error(response.data.message || 'Login failed');
  } catch (error) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.message || 'Login failed');
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error. Please check your connection.');
    } else {
      // Error in request setup
      throw new Error(error.message || 'Login failed');
    }
  }
};

/**
 * Logout admin
 * Removes token from sessionStorage
 */
export const logout = () => {
  removeToken();
};

export default {
  login,
  logout
};

