import * as facultyService from './faculty.service.js';

/**
 * Faculty Controller - Request/response handling for faculty operations
 */

/**
 * Get all faculty
 * GET /api/faculty
 */
export const getAllFaculty = async (req, res) => {
  try {
    const { class: className, section } = req.query;
    const faculty = (className && section)
      ? await facultyService.getFacultyByClassAndSection(className, section)
      : await facultyService.getAllFaculty();
    
    res.status(200).json({
      success: true,
      message: 'Faculty fetched successfully',
      data: faculty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch faculty'
    });
  }
};

/**
 * Get faculty by ID
 * GET /api/faculty/:id
 */
export const getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await facultyService.getFacultyById(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Faculty fetched successfully',
      data: faculty
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch faculty'
    });
  }
};

/**
 * Create faculty
 * POST /api/faculty
 */
export const createFaculty = async (req, res) => {
  try {
    const faculty = await facultyService.createFaculty(req.body);
    res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: faculty
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create faculty'
    });
  }
};

/**
 * Update faculty
 * PUT /api/faculty/:id
 */
export const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await facultyService.updateFaculty(parseInt(id), req.body);
    res.status(200).json({
      success: true,
      message: 'Faculty updated successfully',
      data: faculty
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update faculty'
    });
  }
};

/**
 * Delete faculty
 * DELETE /api/faculty/:id
 */
export const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    await facultyService.deleteFaculty(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Faculty deleted successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete faculty'
    });
  }
};
