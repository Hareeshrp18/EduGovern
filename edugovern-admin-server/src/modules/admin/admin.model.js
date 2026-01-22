import pool from '../../config/mysql.config.js';

/**
 * Admin Model - Database operations for admin
 */

/**
 * Find admin by admin_id
 * @param {string} adminId - Admin ID to search for
 * @returns {Promise<Object|null>} Admin record or null if not found
 */
export const findByAdminId = async (adminId) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE admin_id = ?',
      [adminId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find admin by ID
 * @param {number} id - Admin ID
 * @returns {Promise<Object|null>} Admin record or null if not found
 */
export const findById = async (id) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, admin_id, name, created_at FROM admins WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find admin by reset token
 * @param {string} token - Reset token
 * @returns {Promise<Object|null>} Admin record or null if not found
 */
export const findByResetToken = async (token) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Update reset token for admin
 * @param {string} adminId - Admin ID
 * @param {string} token - Reset token
 * @param {Date} expiry - Token expiry date
 * @returns {Promise<boolean>} Success status
 */
export const updateResetToken = async (adminId, token, expiry) => {
  try {
    await pool.execute(
      'UPDATE admins SET reset_token = ?, reset_token_expiry = ? WHERE admin_id = ?',
      [token, expiry, adminId]
    );
    return true;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Update admin password and clear reset token
 * @param {number} id - Admin ID
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} Success status
 */
export const updatePassword = async (id, hashedPassword) => {
  try {
    await pool.execute(
      'UPDATE admins SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, id]
    );
    return true;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

