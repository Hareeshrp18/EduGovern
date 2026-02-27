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
 * Get faculty by staff_id
 * @param {string} staffId - staff_id (e.g. staff100@sks)
 * @returns {Promise<Object>} Faculty data
 */
export const getFacultyById = async (staffId) => {
  try {
    const faculty = await facultyModel.findById(staffId);
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
    // Accept both staff_name and name (form may send either)
    const staff_name = (facultyData.staff_name || facultyData.name || '').trim();
    if (!staff_name) {
      throw new Error('Name is required');
    }

    // Check if class and section are both provided
    const className = facultyData.class?.trim();
    const section = facultyData.section?.trim();
    
    // If both class and section are provided, check for existing assignment
    if (className && section) {
      console.log(`Checking for existing faculty in Class: "${className}", Section: "${section}"`);
      const existingFaculty = await facultyModel.findByClassAndSection(className, section);
      console.log(`Found ${existingFaculty?.length || 0} existing faculty members`);
      
      if (existingFaculty && existingFaculty.length > 0) {
        const facultyNames = existingFaculty.map(f => f.staff_name).join(', ');
        throw new Error(`Class ${className} - Section ${section} is already assigned to ${facultyNames}. Only one faculty member can be assigned as class in-charge.`);
      }
    }

    const payload = { ...facultyData, staff_name };
    delete payload.name; // prefer staff_name only
    return await facultyModel.create(payload);
  } catch (error) {
    // Don't wrap the error message if it's already a validation error
    if (error.message.includes('already assigned')) {
      throw error;
    }
    throw new Error(`Failed to create faculty: ${error.message}`);
  }
};

/**
 * Update faculty
 * @param {string} staffId - staff_id (e.g. staff100@sks)
 * @param {Object} facultyData - Updated faculty data
 * @returns {Promise<Object>} Updated faculty
 */
export const updateFaculty = async (staffId, facultyData) => {
  try {
    const existing = await facultyModel.findById(staffId);
    if (!existing) {
      throw new Error('Faculty not found');
    }

    // Check if class and section are both provided
    const className = facultyData.class?.trim();
    const section = facultyData.section?.trim();
    
    // If both class and section are provided, check for existing assignment
    if (className && section) {
      console.log(`Checking for existing faculty in Class: "${className}", Section: "${section}" (excluding ${staffId})`);
      const existingFaculty = await facultyModel.findByClassAndSection(className, section);
      console.log(`Found ${existingFaculty?.length || 0} existing faculty members`);
      
      // Check if another faculty (not the current one) is already assigned to this class-section
      if (existingFaculty && existingFaculty.length > 0) {
        const otherFaculty = existingFaculty.filter(f => f.staff_id !== staffId);
        if (otherFaculty.length > 0) {
          const facultyNames = otherFaculty.map(f => f.staff_name).join(', ');
          throw new Error(`Class ${className} - Section ${section} is already assigned to ${facultyNames}. Only one faculty member can be assigned as class in-charge.`);
        }
      }
    }

    // Normalize staff_name (accept name or staff_name)
    const staff_name = (facultyData.staff_name ?? facultyData.name ?? existing.staff_name ?? existing.name ?? '').trim();
    const payload = { ...facultyData, staff_name };
    delete payload.name;
    return await facultyModel.update(staffId, payload);
  } catch (error) {
    // Don't wrap the error message if it's already a validation error
    if (error.message.includes('already assigned')) {
      throw error;
    }
    throw new Error(`Failed to update faculty: ${error.message}`);
  }
};

/**
 * Delete faculty
 * @param {string} staffId - staff_id (e.g. staff100@sks)
 * @returns {Promise<void>}
 */
export const deleteFaculty = async (staffId) => {
  try {
    const faculty = await facultyModel.findById(staffId);
    if (!faculty) {
      throw new Error('Faculty not found');
    }
    await facultyModel.remove(staffId);
  } catch (error) {
    throw new Error(`Failed to delete faculty: ${error.message}`);
  }
};
