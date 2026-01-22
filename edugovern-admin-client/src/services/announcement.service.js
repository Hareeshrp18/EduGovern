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
 * Announcement Service - API calls for announcement operations
 */

/**
 * Get all announcements
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} List of announcements
 */
export const getAllAnnouncements = async (status = null) => {
  try {
    const url = status ? `/api/announcements?status=${status}` : '/api/announcements';
    const response = await apiClient.get(url);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch announcements');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get announcement by ID
 * @param {number} id - Announcement ID
 * @returns {Promise<Object>} Announcement data
 */
export const getAnnouncementById = async (id) => {
  try {
    const response = await apiClient.get(`/api/announcements/${id}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch announcement');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Create a new announcement
 * @param {Object} announcementData - Announcement data
 * @returns {Promise<Object>} Created announcement
 */
export const createAnnouncement = async (announcementData) => {
  try {
    const response = await apiClient.post('/api/announcements', announcementData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to create announcement');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Update announcement
 * @param {number} id - Announcement ID
 * @param {Object} announcementData - Updated announcement data
 * @returns {Promise<Object>} Updated announcement
 */
export const updateAnnouncement = async (id, announcementData) => {
  try {
    const response = await apiClient.put(`/api/announcements/${id}`, announcementData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update announcement');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Delete announcement
 * @param {number} id - Announcement ID
 * @returns {Promise<void>}
 */
export const deleteAnnouncement = async (id) => {
  try {
    await apiClient.delete(`/api/announcements/${id}`);
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete announcement');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export default {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
