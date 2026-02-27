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
 * Get faculty by staff_id
 * GET /api/faculty/:id (id param = staff_id, e.g. staff100@sks)
 */
export const getFacultyById = async (req, res) => {
  try {
    const staffId = (req.params.id ?? '').toString().trim();
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Invalid staff_id' });
    }
    const faculty = await facultyService.getFacultyById(staffId);
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
 * PUT /api/faculty/:id (id param = staff_id)
 */
export const updateFaculty = async (req, res) => {
  try {
    const staffId = (req.params.id ?? '').toString().trim();
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Invalid staff_id' });
    }
    const faculty = await facultyService.updateFaculty(staffId, req.body);
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
 * DELETE /api/faculty/:id (id param = staff_id)
 */
export const deleteFaculty = async (req, res) => {
  try {
    const staffId = (req.params.id ?? '').toString().trim();
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Invalid staff_id' });
    }
    await facultyService.deleteFaculty(staffId);
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
