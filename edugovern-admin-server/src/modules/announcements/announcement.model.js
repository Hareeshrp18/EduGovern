import pool from '../../config/mysql.config.js';

/**
 * Announcement Model - Database operations for announcements
 */

/**
 * Get all announcements
 * @returns {Promise<Array>} List of all announcements
 */
export const findAll = async () => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM announcements ORDER BY created_at DESC'
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find announcement by ID
 * @param {number} id - Announcement ID
 * @returns {Promise<Object|null>} Announcement record or null if not found
 */
export const findById = async (id) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Create a new announcement
 * @param {Object} announcementData - Announcement data
 * @returns {Promise<Object>} Created announcement record
 */
export const create = async (announcementData) => {
  try {
    const {
      title,
      content,
      recipients,
      scheduled_time,
      status = 'Draft'
    } = announcementData;

    const [result] = await pool.execute(
      `INSERT INTO announcements (title, content, recipients, scheduled_time, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        title,
        content,
        JSON.stringify(recipients),
        scheduled_time || null,
        status
      ]
    );

    return await findById(result.insertId);
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Update announcement by ID
 * @param {number} id - Announcement ID
 * @param {Object} announcementData - Updated announcement data
 * @returns {Promise<Object>} Updated announcement record
 */
export const update = async (id, announcementData) => {
  try {
    // Get existing announcement to preserve fields not being updated
    const existing = await findById(id);
    if (!existing) {
      throw new Error('Announcement not found');
    }

    const {
      title = existing.title,
      content = existing.content,
      recipients = existing.recipients,
      scheduled_time = existing.scheduled_time,
      status = existing.status
    } = announcementData;

    // Ensure recipients is properly stringified if it's an array
    const recipientsString = Array.isArray(recipients) 
      ? JSON.stringify(recipients) 
      : (typeof recipients === 'string' ? recipients : JSON.stringify(recipients));

    await pool.execute(
      `UPDATE announcements SET
        title = ?, content = ?, recipients = ?, scheduled_time = ?, status = ?
      WHERE id = ?`,
      [
        title,
        content,
        recipientsString,
        scheduled_time || null,
        status,
        id
      ]
    );

    return await findById(id);
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Delete announcement by ID
 * @param {number} id - Announcement ID
 * @returns {Promise<boolean>} Success status
 */
export const remove = async (id) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM announcements WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Get announcements by status
 * @param {string} status - Status filter (Draft, Published, Scheduled)
 * @returns {Promise<Array>} List of announcements
 */
export const findByStatus = async (status) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM announcements WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find scheduled announcements that should be published (scheduled_time has passed)
 * @returns {Promise<Array>} List of announcements that should be published
 */
export const findScheduledToPublish = async () => {
  try {
    const now = new Date();
    const [rows] = await pool.execute(
      `SELECT * FROM announcements 
       WHERE status = 'Scheduled' 
       AND scheduled_time IS NOT NULL 
       AND scheduled_time <= ?`,
      [now]
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Update announcement status to Published
 * @param {number} id - Announcement ID
 * @returns {Promise<Object>} Updated announcement record
 */
export const publishById = async (id) => {
  try {
    await pool.execute(
      `UPDATE announcements SET status = 'Published' WHERE id = ?`,
      [id]
    );
    return await findById(id);
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};
