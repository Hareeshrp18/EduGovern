import * as announcementModel from './announcement.model.js';

/**
 * Announcement Service - Business logic for announcements
 */

/**
 * Get all announcements
 * @returns {Promise<Array>} List of all announcements
 */
export const getAllAnnouncements = async () => {
  try {
    const announcements = await announcementModel.findAll();
    // Parse JSON recipients for each announcement
    return announcements.map(announcement => ({
      ...announcement,
      recipients: typeof announcement.recipients === 'string' 
        ? JSON.parse(announcement.recipients) 
        : announcement.recipients
    }));
  } catch (error) {
    throw new Error(`Failed to fetch announcements: ${error.message}`);
  }
};

/**
 * Get announcement by ID
 * @param {number} id - Announcement ID
 * @returns {Promise<Object>} Announcement data
 */
export const getAnnouncementById = async (id) => {
  try {
    const announcement = await announcementModel.findById(id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }
    // Parse JSON recipients
    return {
      ...announcement,
      recipients: typeof announcement.recipients === 'string' 
        ? JSON.parse(announcement.recipients) 
        : announcement.recipients
    };
  } catch (error) {
    throw new Error(`Failed to fetch announcement: ${error.message}`);
  }
};

/**
 * Create a new announcement
 * @param {Object} announcementData - Announcement data
 * @returns {Promise<Object>} Created announcement
 */
export const createAnnouncement = async (announcementData) => {
  try {
    // Validate required fields
    if (!announcementData.title || !announcementData.content) {
      throw new Error('Title and content are required');
    }

    if (!announcementData.recipients || !Array.isArray(announcementData.recipients)) {
      throw new Error('Recipients must be an array');
    }

    const announcement = await announcementModel.create(announcementData);
    return {
      ...announcement,
      recipients: typeof announcement.recipients === 'string' 
        ? JSON.parse(announcement.recipients) 
        : announcement.recipients
    };
  } catch (error) {
    throw new Error(`Failed to create announcement: ${error.message}`);
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
    const existing = await announcementModel.findById(id);
    if (!existing) {
      throw new Error('Announcement not found');
    }

    // Prevent Scheduled announcements from being changed to Published unintentionally
    // Preserve existing status if not explicitly provided
    if (!announcementData.status) {
      announcementData.status = existing.status;
    }

    // If announcement is Scheduled, prevent changing to Published before scheduled time
    if (existing.status === 'Scheduled' && announcementData.status === 'Published') {
      const now = new Date();
      const scheduledTime = existing.scheduled_time ? new Date(existing.scheduled_time) : null;
      
      // If scheduled_time exists and hasn't passed, prevent changing to Published
      if (scheduledTime && scheduledTime > now) {
        throw new Error('Cannot change Scheduled announcement to Published before the scheduled time. Please wait until the scheduled time or update the scheduled_time first.');
      }
    }

    const announcement = await announcementModel.update(id, announcementData);
    return {
      ...announcement,
      recipients: typeof announcement.recipients === 'string' 
        ? JSON.parse(announcement.recipients) 
        : announcement.recipients
    };
  } catch (error) {
    throw new Error(`Failed to update announcement: ${error.message}`);
  }
};

/**
 * Delete announcement
 * @param {number} id - Announcement ID
 * @returns {Promise<void>}
 */
export const deleteAnnouncement = async (id) => {
  try {
    const announcement = await announcementModel.findById(id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }
    await announcementModel.remove(id);
  } catch (error) {
    throw new Error(`Failed to delete announcement: ${error.message}`);
  }
};

/**
 * Get announcements by status
 * @param {string} status - Status filter
 * @returns {Promise<Array>} List of announcements
 */
export const getAnnouncementsByStatus = async (status) => {
  try {
    const announcements = await announcementModel.findByStatus(status);
    return announcements.map(announcement => ({
      ...announcement,
      recipients: typeof announcement.recipients === 'string' 
        ? JSON.parse(announcement.recipients) 
        : announcement.recipients
    }));
  } catch (error) {
    throw new Error(`Failed to fetch announcements: ${error.message}`);
  }
};

/**
 * Publish scheduled announcements whose scheduled_time has passed
 * @returns {Promise<number>} Number of announcements published
 */
export const publishScheduledAnnouncements = async () => {
  try {
    const scheduledAnnouncements = await announcementModel.findScheduledToPublish();
    let publishedCount = 0;

    for (const announcement of scheduledAnnouncements) {
      await announcementModel.publishById(announcement.id);
      publishedCount++;
    }

    return publishedCount;
  } catch (error) {
    throw new Error(`Failed to publish scheduled announcements: ${error.message}`);
  }
};
