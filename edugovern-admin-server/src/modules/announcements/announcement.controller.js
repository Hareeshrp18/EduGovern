import * as announcementService from './announcement.service.js';

/**
 * Announcement Controller - Request/response handling for announcement operations
 */

/**
 * Get all announcements
 * GET /api/announcements
 */
export const getAllAnnouncements = async (req, res) => {
  try {
    const { status } = req.query;
    const announcements = status 
      ? await announcementService.getAnnouncementsByStatus(status)
      : await announcementService.getAllAnnouncements();
    
    res.status(200).json({
      success: true,
      message: 'Announcements fetched successfully',
      data: announcements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch announcements'
    });
  }
};

/**
 * Get announcement by ID
 * GET /api/announcements/:id
 */
export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await announcementService.getAnnouncementById(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Announcement fetched successfully',
      data: announcement
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch announcement'
    });
  }
};

/**
 * Create announcement
 * POST /api/announcements
 */
export const createAnnouncement = async (req, res) => {
  try {
    const announcement = await announcementService.createAnnouncement(req.body);
    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create announcement'
    });
  }
};

/**
 * Update announcement
 * PUT /api/announcements/:id
 */
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await announcementService.updateAnnouncement(parseInt(id), req.body);
    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update announcement'
    });
  }
};

/**
 * Delete announcement
 * DELETE /api/announcements/:id
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await announcementService.deleteAnnouncement(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete announcement'
    });
  }
};
