import pool from '../../config/mysql.config.js';

/**
 * Maintenance Model - Database operations for bus maintenance records
 */

/**
 * Get all maintenance records for a bus
 * @param {number} busId - Bus ID
 * @returns {Promise<Array>} List of maintenance records
 */
export const findByBusId = async (busId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, b.bus_number, b.registration_number 
       FROM bus_maintenance m
       JOIN buses b ON m.bus_id = b.id
       WHERE m.bus_id = ?
       ORDER BY m.maintenance_date DESC, m.created_at DESC`,
      [busId]
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Get maintenance records by date range
 * @param {number} busId - Bus ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} List of maintenance records
 */
export const findByDateRange = async (busId, startDate, endDate) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, b.bus_number, b.registration_number 
       FROM bus_maintenance m
       JOIN buses b ON m.bus_id = b.id
       WHERE m.bus_id = ? AND m.maintenance_date BETWEEN ? AND ?
       ORDER BY m.maintenance_date DESC, m.created_at DESC`,
      [busId, startDate, endDate]
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Get maintenance records by month
 * @param {number} busId - Bus ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Array>} List of maintenance records
 */
export const findByMonth = async (busId, year, month) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, b.bus_number, b.registration_number 
       FROM bus_maintenance m
       JOIN buses b ON m.bus_id = b.id
       WHERE m.bus_id = ? AND YEAR(m.maintenance_date) = ? AND MONTH(m.maintenance_date) = ?
       ORDER BY m.maintenance_date DESC, m.created_at DESC`,
      [busId, year, month]
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find maintenance record by ID
 * @param {number} id - Maintenance record ID
 * @returns {Promise<Object|null>} Maintenance record or null if not found
 */
export const findById = async (id) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, b.bus_number, b.registration_number 
       FROM bus_maintenance m
       JOIN buses b ON m.bus_id = b.id
       WHERE m.id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Create a new maintenance record
 * @param {Object} maintenanceData - Maintenance data
 * @returns {Promise<Object>} Created maintenance record
 */
export const create = async (maintenanceData) => {
  try {
    const {
      bus_id,
      maintenance_date,
      maintenance_type,
      description,
      cost,
      service_provider,
      next_maintenance_date,
      odometer_reading,
      notes
    } = maintenanceData;

    const [result] = await pool.execute(
      `INSERT INTO bus_maintenance (
        bus_id, maintenance_date, maintenance_type, description,
        cost, service_provider, next_maintenance_date, odometer_reading, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bus_id,
        maintenance_date,
        maintenance_type,
        description || null,
        cost || null,
        service_provider || null,
        next_maintenance_date || null,
        odometer_reading || null,
        notes || null
      ]
    );

    return await findById(result.insertId);
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Update maintenance record by ID
 * @param {number} id - Maintenance record ID
 * @param {Object} maintenanceData - Updated maintenance data
 * @returns {Promise<Object>} Updated maintenance record
 */
export const update = async (id, maintenanceData) => {
  try {
    const {
      maintenance_date,
      maintenance_type,
      description,
      cost,
      service_provider,
      next_maintenance_date,
      odometer_reading,
      notes
    } = maintenanceData;

    await pool.execute(
      `UPDATE bus_maintenance SET
        maintenance_date = ?, maintenance_type = ?, description = ?,
        cost = ?, service_provider = ?, next_maintenance_date = ?,
        odometer_reading = ?, notes = ?
      WHERE id = ?`,
      [
        maintenance_date,
        maintenance_type,
        description || null,
        cost || null,
        service_provider || null,
        next_maintenance_date || null,
        odometer_reading || null,
        notes || null,
        id
      ]
    );

    return await findById(id);
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Delete maintenance record by ID
 * @param {number} id - Maintenance record ID
 * @returns {Promise<boolean>} Success status
 */
export const remove = async (id) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM bus_maintenance WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};
