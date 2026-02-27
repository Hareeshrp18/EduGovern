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
 * Transport Service - API calls for bus/vehicle operations
 */

/**
 * Get all buses
 * @returns {Promise<Array>} List of buses
 */
export const getAllBuses = async () => {
  try {
    const response = await apiClient.get('/api/transport/buses');
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch buses');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get bus by ID
 * @param {number} id - Bus ID
 * @returns {Promise<Object>} Bus data
 */
export const getBusById = async (id) => {
  try {
    const response = await apiClient.get(`/api/transport/buses/${id}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch bus');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Create a new bus
 * @param {Object} busData - Bus data
 * @returns {Promise<Object>} Created bus
 */
export const createBus = async (busData) => {
  try {
    const response = await apiClient.post('/api/transport/buses', busData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to create bus');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Update bus
 * @param {number} id - Bus ID
 * @param {Object} busData - Updated bus data
 * @returns {Promise<Object>} Updated bus
 */
export const updateBus = async (id, busData) => {
  try {
    const response = await apiClient.put(`/api/transport/buses/${id}`, busData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update bus');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Delete bus
 * @param {number} id - Bus ID
 * @returns {Promise<void>}
 */
export const deleteBus = async (id) => {
  try {
    await apiClient.delete(`/api/transport/buses/${id}`);
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete bus');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get buses with expiring documents (alerts)
 * @param {number} months - Number of months before expiration (default: 2)
 * @returns {Promise<Array>} List of buses with alerts
 */
export const getBusesWithExpiringDocuments = async (months = 2) => {
  try {
    const response = await apiClient.get(`/api/transport/buses/alerts?months=${months}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch alerts');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get maintenance records for a bus
 * @param {number} busId - Bus ID
 * @param {Object} filters - Optional filters (startDate, endDate, year, month)
 * @returns {Promise<Array>} List of maintenance records
 */
export const getBusMaintenance = async (busId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.year) params.append('year', filters.year);
    if (filters.month) params.append('month', filters.month);

    const response = await apiClient.get(`/api/transport/maintenance/bus/${busId}?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch maintenance records');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Get maintenance record by ID
 * @param {number} id - Maintenance record ID
 * @returns {Promise<Object>} Maintenance record
 */
export const getMaintenanceById = async (id) => {
  try {
    const response = await apiClient.get(`/api/transport/maintenance/${id}`);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch maintenance record');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Create a new maintenance record
 * @param {Object} maintenanceData - Maintenance data
 * @returns {Promise<Object>} Created maintenance record
 */
export const createMaintenance = async (maintenanceData) => {
  try {
    const response = await apiClient.post('/api/transport/maintenance', maintenanceData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to create maintenance record');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Update maintenance record
 * @param {number} id - Maintenance record ID
 * @param {Object} maintenanceData - Updated maintenance data
 * @returns {Promise<Object>} Updated maintenance record
 */
export const updateMaintenance = async (id, maintenanceData) => {
  try {
    const response = await apiClient.put(`/api/transport/maintenance/${id}`, maintenanceData);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update maintenance record');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Delete maintenance record
 * @param {number} id - Maintenance record ID
 * @returns {Promise<void>}
 */
export const deleteMaintenance = async (id) => {
  try {
    await apiClient.delete(`/api/transport/maintenance/${id}`);
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete maintenance record');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Upload bus images to Cloudinary
 * @param {FileList|Array<File>} files - Image files to upload
 * @returns {Promise<Array<string>>} Array of image URLs
 */
export const uploadBusImages = async (files) => {
  try {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });

    const token = getToken();
    const response = await axios.post(
      `${API_URL}/api/transport/buses/upload-images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : ''
        }
      }
    );

    return response.data.data.images;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to upload images');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export default {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  getBusesWithExpiringDocuments,
  getBusMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance
};
