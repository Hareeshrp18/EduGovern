import axios from 'axios';
import { getToken } from '../utils/auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadFile = async (file, folder) => {
  try {
    const form = new FormData();
    form.append('file', file);
    if (folder) form.append('folder', folder);

    const response = await apiClient.post('/api/uploads', form, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to upload file');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export default {
  uploadFile
};