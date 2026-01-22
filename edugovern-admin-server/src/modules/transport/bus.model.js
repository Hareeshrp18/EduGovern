import pool from '../../config/mysql.config.js';

/**
 * Bus Model - Database operations for buses/vehicles
 */

/**
 * Get all buses
 * @returns {Promise<Array>} List of all buses
 */
export const findAll = async () => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM buses ORDER BY created_at DESC'
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find bus by ID
 * @param {number} id - Bus ID
 * @returns {Promise<Object|null>} Bus record or null if not found
 */
export const findById = async (id) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM buses WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find bus by bus number
 * @param {string} busNumber - Bus number
 * @returns {Promise<Object|null>} Bus record or null if not found
 */
export const findByBusNumber = async (busNumber) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM buses WHERE bus_number = ?',
      [busNumber]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Create a new bus
 * @param {Object} busData - Bus data
 * @returns {Promise<Object>} Created bus record
 */
export const create = async (busData) => {
  try {
    const {
      bus_number,
      registration_number,
      driver_name,
      driver_contact,
      route_name,
      capacity,
      insurance_expiry,
      fc_expiry,
      permit_expiry,
      status = 'Active'
    } = busData;

    const [result] = await pool.execute(
      `INSERT INTO buses (
        bus_number, registration_number, driver_name, driver_contact,
        route_name, capacity, insurance_expiry, fc_expiry, permit_expiry, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bus_number,
        registration_number,
        driver_name || null,
        driver_contact || null,
        route_name || null,
        capacity || null,
        insurance_expiry || null,
        fc_expiry || null,
        permit_expiry || null,
        status
      ]
    );

    return await findById(result.insertId);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Bus number or registration number already exists');
    }
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Update bus by ID
 * @param {number} id - Bus ID
 * @param {Object} busData - Updated bus data
 * @returns {Promise<Object>} Updated bus record
 */
export const update = async (id, busData) => {
  try {
    const {
      bus_number,
      registration_number,
      driver_name,
      driver_contact,
      route_name,
      capacity,
      insurance_expiry,
      fc_expiry,
      permit_expiry,
      status
    } = busData;

    await pool.execute(
      `UPDATE buses SET
        bus_number = ?, registration_number = ?, driver_name = ?, driver_contact = ?,
        route_name = ?, capacity = ?, insurance_expiry = ?, fc_expiry = ?,
        permit_expiry = ?, status = ?
      WHERE id = ?`,
      [
        bus_number,
        registration_number,
        driver_name || null,
        driver_contact || null,
        route_name || null,
        capacity || null,
        insurance_expiry || null,
        fc_expiry || null,
        permit_expiry || null,
        status,
        id
      ]
    );

    return await findById(id);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Bus number or registration number already exists');
    }
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Delete bus by ID
 * @param {number} id - Bus ID
 * @returns {Promise<boolean>} Success status
 */
export const remove = async (id) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM buses WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Find buses with expiring documents (within specified months)
 * @param {number} months - Number of months before expiration to check
 * @returns {Promise<Array>} List of buses with expiring documents
 */
export const findBusesWithExpiringDocuments = async (months = 2) => {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + months);
    
    // Format dates for MySQL
    const nowStr = now.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];
    
    const [rows] = await pool.execute(
      `SELECT * FROM buses 
       WHERE (insurance_expiry IS NOT NULL AND insurance_expiry BETWEEN ? AND ?)
          OR (fc_expiry IS NOT NULL AND fc_expiry BETWEEN ? AND ?)
          OR (permit_expiry IS NOT NULL AND permit_expiry BETWEEN ? AND ?)
       ORDER BY 
         COALESCE(
           CASE WHEN insurance_expiry BETWEEN ? AND ? THEN insurance_expiry END,
           CASE WHEN fc_expiry BETWEEN ? AND ? THEN fc_expiry END,
           CASE WHEN permit_expiry BETWEEN ? AND ? THEN permit_expiry END
         ) ASC`,
      [
        nowStr, futureStr, // insurance WHERE
        nowStr, futureStr, // fc WHERE
        nowStr, futureStr, // permit WHERE
        nowStr, futureStr, // insurance ORDER
        nowStr, futureStr, // fc ORDER
        nowStr, futureStr  // permit ORDER
      ]
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};
