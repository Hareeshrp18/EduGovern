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
 * Message Service - API calls for message operations
 */

/**
 * Get all messages
 * @param {Object} filters - Filter options (sender_type, is_read, is_replied)
 * @returns {Promise<Array>} List of messages
 */
export const getAllMessages = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.sender_type) params.append('sender_type', filters.sender_type);
    if (filters.is_read !== undefined) params.append('is_read', filters.is_read);
    if (filters.is_replied !== undefined) params.append('is_replied', filters.is_replied);

    const response = await apiClient.get(`/api/messages?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch messages');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get message by ID
 * @param {number} id - Message ID
 * @returns {Promise<Object>} Message data
 */
export const getMessageById = async (id) => {
  try {
    const response = await apiClient.get(`/api/messages/${id}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch message');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Send a reply message
 * @param {Object} messageData - Message data (message, reply_to)
 * @returns {Promise<Object>} Created message
 */
const postMessageWithAttachment = async (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  const response = await apiClient.post('/api/messages', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
};

export const sendReply = async (messageData) => {
  try {
    return await postMessageWithAttachment(messageData);
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to send reply');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Send a new message from admin to a specific recipient
 * @param {Object} messageData - { recipient_id, recipient_name, recipient_type, subject, message, attachment }
 */
export const sendMessage = async (messageData) => {
  try {
    return await postMessageWithAttachment(messageData);
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to send message');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Mark message as read
 * @param {number} id - Message ID
 * @returns {Promise<Object>} Updated message
 */
export const markAsRead = async (id) => {
  try {
    const response = await apiClient.put(`/api/messages/${id}/read`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to mark message as read');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Mark multiple messages as read
 * @param {Array<number>} ids - Array of message IDs
 * @returns {Promise<void>}
 */
export const markMultipleAsRead = async (ids) => {
  try {
    await apiClient.put('/api/messages/read-multiple', { ids });
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to mark messages as read');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Delete message
 * @param {number} id - Message ID
 * @returns {Promise<void>}
 */
export const deleteMessage = async (id) => {
  try {
    await apiClient.delete(`/api/messages/${id}`);
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete message');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get unread message count
 * @returns {Promise<number>} Count of unread messages
 */
export const getUnreadCount = async () => {
  try {
    const response = await apiClient.get('/api/messages/unread-count');
    return response.data.data.count;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to get unread count');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export default {
  getAllMessages,
  getMessageById,
  sendReply,
  sendMessage,
  markAsRead,
  markMultipleAsRead,
  deleteMessage,
  getUnreadCount
};
