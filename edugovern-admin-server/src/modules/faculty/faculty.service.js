import * as facultyModel from './faculty.model.js';

/**
 * Faculty Service - Business logic for faculty
 */

/**
 * Get all faculty
 * @returns {Promise<Array>} List of all faculty
 */
export const getAllFaculty = async () => {
  try {
    return await facultyModel.findAll();
  } catch (error) {
    throw new Error(`Failed to fetch faculty: ${error.message}`);
  }
};

/**
 * Get faculty by ID
 * @param {number} id - Faculty ID
 * @returns {Promise<Object>} Faculty data
 */
export const getFacultyById = async (id) => {
  try {
    const faculty = await facultyModel.findById(id);
    if (!faculty) {
      throw new Error('Faculty not found');
    }
    return faculty;
  } catch (error) {
    throw new Error(`Failed to fetch faculty: ${error.message}`);
  }
};

/**
 * Get faculty by class and section
 * @param {string} className - Class name
 * @param {string} section - Section
 * @returns {Promise<Array>} List of faculty
 */
export const getFacultyByClassAndSection = async (className, section) => {
  try {
    return await facultyModel.findByClassAndSection(className, section);
  } catch (error) {
    throw new Error(`Failed to fetch faculty: ${error.message}`);
  }
};

/**
 * Create a new faculty member
 * @param {Object} facultyData - Faculty data
 * @returns {Promise<Object>} Created faculty
 */
export const createFaculty = async (facultyData) => {
  try {
    // Validate required fields
    if (!facultyData.name) {
      throw new Error('Name is required');
    }

    return await facultyModel.create(facultyData);
  } catch (error) {
    throw new Error(`Failed to create faculty: ${error.message}`);
  }
};

/**
 * Update faculty
 * @param {number} id - Faculty ID
 * @param {Object} facultyData - Updated faculty data
 * @returns {Promise<Object>} Updated faculty
 */
export const updateFaculty = async (id, facultyData) => {
  try {
    const existing = await facultyModel.findById(id);
    if (!existing) {
      throw new Error('Faculty not found');
    }

    return await facultyModel.update(id, facultyData);
  } catch (error) {
    throw new Error(`Failed to update faculty: ${error.message}`);
  }
};

/**
 * Delete faculty
 * @param {number} id - Faculty ID
 * @returns {Promise<void>}
 */
export const deleteFaculty = async (id) => {
  try {
    const faculty = await facultyModel.findById(id);
    if (!faculty) {
      throw new Error('Faculty not found');
    }
    await facultyModel.remove(id);
  } catch (error) {
    throw new Error(`Failed to delete faculty: ${error.message}`);
  }
};
