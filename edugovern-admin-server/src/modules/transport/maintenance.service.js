import * as maintenanceModel from './maintenance.model.js';

/**
 * Maintenance Service - Business logic for bus maintenance
 */

/**
 * Get all maintenance records for a bus
 * @param {number} busId - Bus ID
 * @returns {Promise<Array>} List of maintenance records
 */
export const getMaintenanceByBusId = async (busId) => {
  try {
    return await maintenanceModel.findByBusId(busId);
  } catch (error) {
    throw new Error(`Failed to fetch maintenance records: ${error.message}`);
  }
};

/**
 * Get maintenance records by date range
 * @param {number} busId - Bus ID
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Array>} List of maintenance records
 */
export const getMaintenanceByDateRange = async (busId, startDate, endDate) => {
  try {
    return await maintenanceModel.findByDateRange(busId, startDate, endDate);
  } catch (error) {
    throw new Error(`Failed to fetch maintenance records: ${error.message}`);
  }
};

/**
 * Get maintenance records by month
 * @param {number} busId - Bus ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Array>} List of maintenance records
 */
export const getMaintenanceByMonth = async (busId, year, month) => {
  try {
    return await maintenanceModel.findByMonth(busId, year, month);
  } catch (error) {
    throw new Error(`Failed to fetch maintenance records: ${error.message}`);
  }
};

/**
 * Get maintenance record by ID
 * @param {number} id - Maintenance record ID
 * @returns {Promise<Object>} Maintenance record
 */
export const getMaintenanceById = async (id) => {
  try {
    const record = await maintenanceModel.findById(id);
    if (!record) {
      throw new Error('Maintenance record not found');
    }
    return record;
  } catch (error) {
    throw new Error(`Failed to fetch maintenance record: ${error.message}`);
  }
};

/**
 * Create a new maintenance record
 * @param {Object} maintenanceData - Maintenance data
 * @returns {Promise<Object>} Created maintenance record
 */
export const createMaintenance = async (maintenanceData) => {
  try {
    return await maintenanceModel.create(maintenanceData);
  } catch (error) {
    throw new Error(`Failed to create maintenance record: ${error.message}`);
  }
};

/**
 * Update maintenance record
 * @param {number} id - Maintenance record ID
 * @param {Object} maintenanceData - Updated maintenance data
 * @returns {Promise<Object>} Updated maintenance record
 */
export const updateMaintenance = async (id, maintenanceData) => {
  try {
    return await maintenanceModel.update(id, maintenanceData);
  } catch (error) {
    throw new Error(`Failed to update maintenance record: ${error.message}`);
  }
};

/**
 * Delete maintenance record
 * @param {number} id - Maintenance record ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteMaintenance = async (id) => {
  try {
    return await maintenanceModel.remove(id);
  } catch (error) {
    throw new Error(`Failed to delete maintenance record: ${error.message}`);
  }
};
