import pool from '../../config/mysql.config.js';

/**
 * Message Model - Database operations for messages
 */

/**
 * Get all messages for admin (received messages)
 * @param {Object} filters - Filter options (sender_type, is_read, etc.)
 * @returns {Promise<Array>} List of messages
 */
export const findAllForAdmin = async (filters = {}) => {
  try {
    let query = `
      SELECT *
      FROM messages
      WHERE recipient_type = 'admin'
         OR sender_id = 'admin'
    `;
    const params = [];

    if (filters.sender_type) {
      query += ` AND (
        (recipient_type = 'admin' AND sender_type = ?)
        OR (sender_id = 'admin' AND recipient_type = ?)
      )`;
      params.push(filters.sender_type, filters.sender_type);
    }

    if (filters.is_read !== undefined) {
      query += ' AND is_read = ?';
      params.push(filters.is_read);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find message by ID
 * @param {number} id - Message ID
 * @returns {Promise<Object|null>} Message record or null if not found
 */
export const findById = async (id) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM messages WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Create a new message
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} Created message record
 */
export const create = async (messageData) => {
  try {
    const {
      sender_id,
      sender_name,
      sender_type,
      recipient_id = 'admin',
      recipient_name = 'Admin',
      recipient_type = 'admin',
      subject,
      message,
      attachment_path = null,
      attachment_type = null,
      attachment_name = null,
      attachment_size = null
    } = messageData;

    const [result] = await pool.execute(
      `INSERT INTO messages (
        sender_id, sender_name, sender_type,
        recipient_id, recipient_name, recipient_type,
        subject, message,
        attachment_path, attachment_type, attachment_name, attachment_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sender_id,
        sender_name,
        sender_type,
        recipient_id || null,
        recipient_name || null,
        recipient_type,
        subject || null,
        message,
        attachment_path,
        attachment_type,
        attachment_name,
        attachment_size
      ]
    );

    return await findById(result.insertId);
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Mark message as read
 * @param {number} id - Message ID
 * @returns {Promise<Object>} Updated message record
 */
export const markAsRead = async (id) => {
  try {
    await pool.execute(
      'UPDATE messages SET is_read = TRUE WHERE id = ?',
      [id]
    );
    return await findById(id);
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Mark multiple messages as read
 * @param {Array<number>} ids - Array of message IDs
 * @returns {Promise<boolean>} Success status
 */
export const markMultipleAsRead = async (ids) => {
  try {
    if (ids.length === 0) return true;
    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(
      `UPDATE messages SET is_read = TRUE WHERE id IN (${placeholders})`,
      ids
    );
    return true;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Delete message by ID
 * @param {number} id - Message ID
 * @returns {Promise<boolean>} Success status
 */
export const remove = async (id) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM messages WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Get unread message count for admin
 * @returns {Promise<number>} Count of unread messages
 */
export const getUnreadCount = async () => {
  try {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE recipient_type = 'admin' AND is_read = FALSE`
    );
    return rows[0].count;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Get messages by sender
 * @param {string} senderId - Sender ID
 * @param {string} senderType - Sender type
 * @returns {Promise<Array>} List of messages
 */
export const findBySender = async (senderId, senderType) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM messages
       WHERE sender_id = ? AND sender_type = ?
       ORDER BY created_at DESC`,
      [senderId, senderType]
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};
