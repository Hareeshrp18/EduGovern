import axios from 'axios';
import { getToken } from '../utils/auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getClasses = async () => {
  try {
    const response = await apiClient.get('/api/academic/classes');
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to fetch classes');
    throw new Error('Network error. Please check your connection.');
  }
};

export const getClassById = async (id) => {
  try {
    const response = await apiClient.get(`/api/academic/classes/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to fetch class');
    throw new Error('Network error. Please check your connection.');
  }
};

export const createClass = async (data) => {
  try {
    const response = await apiClient.post('/api/academic/classes', data);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to create class');
    throw new Error('Network error. Please check your connection.');
  }
};

export const updateClass = async (id, data) => {
  try {
    const response = await apiClient.put(`/api/academic/classes/${id}`, data);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to update class');
    throw new Error('Network error. Please check your connection.');
  }
};

export const deleteClass = async (id) => {
  try {
    await apiClient.delete(`/api/academic/classes/${id}`);
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to delete class');
    throw new Error('Network error. Please check your connection.');
  }
};

export const getSections = async () => {
  try {
    const response = await apiClient.get('/api/academic/sections');
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to fetch sections');
    throw new Error('Network error. Please check your connection.');
  }
};

export const getSectionById = async (id) => {
  try {
    const response = await apiClient.get(`/api/academic/sections/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to fetch section');
    throw new Error('Network error. Please check your connection.');
  }
};

export const createSection = async (data) => {
  try {
    const response = await apiClient.post('/api/academic/sections', data);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to create section');
    throw new Error('Network error. Please check your connection.');
  }
};

export const updateSection = async (id, data) => {
  try {
    const response = await apiClient.put(`/api/academic/sections/${id}`, data);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to update section');
    throw new Error('Network error. Please check your connection.');
  }
};

export const deleteSection = async (id) => {
  try {
    await apiClient.delete(`/api/academic/sections/${id}`);
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to delete section');
    throw new Error('Network error. Please check your connection.');
  }
};

export const getSubjects = async (classId = null) => {
  try {
    const url = classId ? `/api/academic/subjects?classId=${classId}` : '/api/academic/subjects';
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to fetch subjects');
    throw new Error('Network error. Please check your connection.');
  }
};

export const getSubjectById = async (id) => {
  try {
    const response = await apiClient.get(`/api/academic/subjects/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to fetch subject');
    throw new Error('Network error. Please check your connection.');
  }
};

export const createSubject = async (data) => {
  try {
    const response = await apiClient.post('/api/academic/subjects', data);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to create subject');
    throw new Error('Network error. Please check your connection.');
  }
};

export const updateSubject = async (id, data) => {
  try {
    const response = await apiClient.put(`/api/academic/subjects/${id}`, data);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to update subject');
    throw new Error('Network error. Please check your connection.');
  }
};

export const deleteSubject = async (id) => {
  try {
    await apiClient.delete(`/api/academic/subjects/${id}`);
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to delete subject');
    throw new Error('Network error. Please check your connection.');
  }
};

export const getExams = async (classId = null) => {
  try {
    const url = classId ? `/api/academic/exams?classId=${classId}` : '/api/academic/exams';
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to fetch exams');
    throw new Error('Network error. Please check your connection.');
  }
};

export const getExamById = async (id) => {
  try {
    const response = await apiClient.get(`/api/academic/exams/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to fetch exam');
    throw new Error('Network error. Please check your connection.');
  }
};

export const createExam = async (data) => {
  try {
    const response = await apiClient.post('/api/academic/exams', data);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to create exam');
    throw new Error('Network error. Please check your connection.');
  }
};

export const updateExam = async (id, data) => {
  try {
    const response = await apiClient.put(`/api/academic/exams/${id}`, data);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to update exam');
    throw new Error('Network error. Please check your connection.');
  }
};

export const deleteExam = async (id) => {
  try {
    await apiClient.delete(`/api/academic/exams/${id}`);
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Failed to delete exam');
    throw new Error('Network error. Please check your connection.');
  }
};
