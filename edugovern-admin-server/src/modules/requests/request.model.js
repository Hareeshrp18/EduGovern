import pool from '../../config/mysql.config.js';

/**
 * Request Model - Database operations for requests
 */

/**
 * Get all requests
 * @param {Object} filters - Filter options (status, request_type, requester_type)
 * @returns {Promise<Array>} List of all requests
 */
export const findAll = async (filters = {}) => {
  try {
    let query = 'SELECT * FROM requests WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.request_type) {
      query += ' AND request_type = ?';
      params.push(filters.request_type);
    }

    if (filters.requester_type) {
      query += ' AND requester_type = ?';
      params.push(filters.requester_type);
    }

    if (filters.requester_id) {
      query += ' AND requester_id = ?';
      params.push(filters.requester_id);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    
    // Parse JSON fields
    return rows.map(row => ({
      ...row,
      attachments: row.attachments ? JSON.parse(row.attachments) : null
    }));
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find request by ID
 * @param {number} id - Request ID
 * @returns {Promise<Object|null>} Request record or null if not found
 */
export const findById = async (id) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM requests WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      ...row,
      attachments: row.attachments ? JSON.parse(row.attachments) : null
    };
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Create a new request
 * @param {Object} requestData - Request data
 * @returns {Promise<Object>} Created request record
 */
export const create = async (requestData) => {
  try {
    const {
      request_type,
      request_subtype,
      requester_type,
      requester_id,
      requester_name,
      requester_email,
      requester_phone,
      subject,
      description,
      start_date,
      end_date,
      duration_days,
      status = 'Pending',
      attachments
    } = requestData;

    const [result] = await pool.execute(
      `INSERT INTO requests (
        request_type, request_subtype, requester_type, requester_id,
        requester_name, requester_email, requester_phone, subject,
        description, start_date, end_date, duration_days, status, attachments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request_type,
        request_subtype || null,
        requester_type,
        requester_id,
        requester_name,
        requester_email || null,
        requester_phone || null,
        subject,
        description,
        start_date || null,
        end_date || null,
        duration_days || null,
        status,
        attachments ? JSON.stringify(attachments) : null
      ]
    );

    return await findById(result.insertId);
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Update request status (approve/reject)
 * @param {number} id - Request ID
 * @param {Object} updateData - Update data (status, admin_comment, admin_id, admin_name)
 * @returns {Promise<Object>} Updated request record
 */
export const updateStatus = async (id, updateData) => {
  try {
    const {
      status,
      admin_comment,
      admin_id,
      admin_name
    } = updateData;

    const reviewed_at = new Date();

    await pool.execute(
      `UPDATE requests SET
        status = ?,
        admin_comment = ?,
        admin_id = ?,
        admin_name = ?,
        reviewed_at = ?
      WHERE id = ?`,
      [
        status,
        admin_comment || null,
        admin_id || null,
        admin_name || null,
        reviewed_at,
        id
      ]
    );

    return await findById(id);
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Update request by ID
 * @param {number} id - Request ID
 * @param {Object} requestData - Updated request data
 * @returns {Promise<Object>} Updated request record
 */
export const update = async (id, requestData) => {
  try {
    const {
      request_type,
      request_subtype,
      subject,
      description,
      start_date,
      end_date,
      duration_days,
      status,
      attachments
    } = requestData;

    const updates = [];
    const params = [];

    if (request_type !== undefined) {
      updates.push('request_type = ?');
      params.push(request_type);
    }
    if (request_subtype !== undefined) {
      updates.push('request_subtype = ?');
      params.push(request_subtype);
    }
    if (subject !== undefined) {
      updates.push('subject = ?');
      params.push(subject);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      params.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(end_date);
    }
    if (duration_days !== undefined) {
      updates.push('duration_days = ?');
      params.push(duration_days);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (attachments !== undefined) {
      updates.push('attachments = ?');
      params.push(attachments ? JSON.stringify(attachments) : null);
    }

    if (updates.length === 0) {
      return await findById(id);
    }

    params.push(id);

    await pool.execute(
      `UPDATE requests SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return await findById(id);
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Delete request by ID
 * @param {number} id - Request ID
 * @returns {Promise<boolean>} Success status
 */
export const remove = async (id) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM requests WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Get request statistics
 * @returns {Promise<Object>} Request statistics
 */
export const getStatistics = async () => {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN request_type = 'Leave' THEN 1 ELSE 0 END) as leave_requests,
        SUM(CASE WHEN request_type = 'Permission' THEN 1 ELSE 0 END) as permission_requests,
        SUM(CASE WHEN request_type = 'Other' THEN 1 ELSE 0 END) as other_requests
      FROM requests`
    );

    return stats[0] || {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      leave_requests: 0,
      permission_requests: 0,
      other_requests: 0
    };
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};
