import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Password Reset Service
 * Handles API calls for password reset operations
 */

/**
 * Request password reset
 * @param {string} adminId - Admin ID
 * @returns {Promise<Object>} Response data
 */
export const forgotPassword = async (adminId) => {
  try {
    const response = await apiClient.post('/api/admin/forgot-password', {
      admin_id: adminId
    });

    if (response.data.success) {
      return response.data;
    }

    throw new Error(response.data.message || 'Failed to send reset link');
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to send reset link');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'Failed to send reset link');
    }
  }
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Response data
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await apiClient.post('/api/admin/reset-password', {
      token: token,
      newPassword: newPassword
    });

    if (response.data.success) {
      return response.data;
    }

    throw new Error(response.data.message || 'Failed to reset password');
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to reset password');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'Failed to reset password');
    }
  }
};

export default {
  forgotPassword,
  resetPassword
};

