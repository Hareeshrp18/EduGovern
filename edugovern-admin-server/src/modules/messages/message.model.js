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
    // First check if attachment columns exist
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'messages' 
       AND COLUMN_NAME IN ('attachment_path', 'attachment_type', 'attachment_name', 'attachment_size')`
    );
    const hasAttachmentColumns = columns.length > 0;

    let query = `
      SELECT m.*, 
             rm.message as reply_message,
             rm.created_at as reply_created_at
    `;

    // Only include attachment columns if they exist
    if (hasAttachmentColumns) {
      query += `, rm.attachment_path as reply_attachment_path,
                 rm.attachment_type as reply_attachment_type,
                 rm.attachment_name as reply_attachment_name,
                 rm.attachment_size as reply_attachment_size`;
    }

    query += `
      FROM messages m
      LEFT JOIN messages rm ON m.id = rm.reply_to
      WHERE m.recipient_type = 'admin'
    `;
    const params = [];

    if (filters.sender_type) {
      query += ' AND m.sender_type = ?';
      params.push(filters.sender_type);
    }

    if (filters.is_read !== undefined) {
      query += ' AND m.is_read = ?';
      params.push(filters.is_read);
    }

    if (filters.is_replied !== undefined) {
      query += ' AND m.is_replied = ?';
      params.push(filters.is_replied);
    }

    query += ' ORDER BY m.created_at DESC';

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
    // Check if attachment columns exist
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'messages' 
       AND COLUMN_NAME IN ('attachment_path', 'attachment_type', 'attachment_name', 'attachment_size')`
    );
    const hasAttachmentColumns = columns.length > 0;

    let query = `
      SELECT m.*, 
             rm.message as reply_message,
             rm.created_at as reply_created_at,
             rm.sender_name as reply_sender_name
    `;

    // Only include attachment columns if they exist
    if (hasAttachmentColumns) {
      query += `, rm.attachment_path as reply_attachment_path,
                 rm.attachment_type as reply_attachment_type,
                 rm.attachment_name as reply_attachment_name,
                 rm.attachment_size as reply_attachment_size`;
    }

    query += `
       FROM messages m
       LEFT JOIN messages rm ON m.id = rm.reply_to
       WHERE m.id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
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
    // Check if attachment columns exist
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'messages' 
       AND COLUMN_NAME IN ('attachment_path', 'attachment_type', 'attachment_name', 'attachment_size')`
    );
    const hasAttachmentColumns = columns.length > 0;

    const {
      sender_id,
      sender_name,
      sender_type,
      recipient_id = 'admin',
      recipient_name = 'Admin',
      recipient_type = 'admin',
      subject,
      message,
      reply_to = null,
      attachment_path = null,
      attachment_type = null,
      attachment_name = null,
      attachment_size = null
    } = messageData;

    // Build INSERT query based on whether attachment columns exist
    let query = `INSERT INTO messages (
      sender_id, sender_name, sender_type,
      recipient_id, recipient_name, recipient_type,
      subject, message, reply_to`;
    
    let values = ` VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?`;
    let params = [
      sender_id,
      sender_name,
      sender_type,
      recipient_id,
      recipient_name,
      recipient_type,
      subject || null,
      message,
      reply_to || null
    ];

    // Add attachment columns only if they exist
    if (hasAttachmentColumns) {
      query += `, attachment_path, attachment_type, attachment_name, attachment_size`;
      values += `, ?, ?, ?, ?`;
      params.push(
        attachment_path || null,
        attachment_type || null,
        attachment_name || null,
        attachment_size || null
      );
    }

    query += `)` + values + `)`;

    const [result] = await pool.execute(query, params);

    // If this is a reply, update the original message
    if (reply_to) {
      await pool.execute(
        'UPDATE messages SET is_replied = TRUE WHERE id = ?',
        [reply_to]
      );
    }

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
      `SELECT m.*, 
              rm.message as reply_message,
              rm.created_at as reply_created_at
       FROM messages m
       LEFT JOIN messages rm ON m.id = rm.reply_to
       WHERE m.sender_id = ? AND m.sender_type = ?
       ORDER BY m.created_at DESC`,
      [senderId, senderType]
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};
