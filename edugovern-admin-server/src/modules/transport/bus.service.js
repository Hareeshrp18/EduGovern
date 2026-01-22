import * as busModel from './bus.model.js';

/**
 * Bus Service - Business logic for bus/vehicle operations
 */

/**
 * Get all buses
 * @returns {Promise<Array>} List of all buses
 */
export const getAllBuses = async () => {
  try {
    return await busModel.findAll();
  } catch (error) {
    throw new Error(`Failed to fetch buses: ${error.message}`);
  }
};

/**
 * Get bus by ID
 * @param {number} id - Bus ID
 * @returns {Promise<Object>} Bus data
 */
export const getBusById = async (id) => {
  try {
    const bus = await busModel.findById(id);
    if (!bus) {
      throw new Error('Bus not found');
    }
    return bus;
  } catch (error) {
    throw new Error(`Failed to fetch bus: ${error.message}`);
  }
};

/**
 * Create a new bus
 * @param {Object} busData - Bus data
 * @returns {Promise<Object>} Created bus
 */
export const createBus = async (busData) => {
  try {
    // Validate required fields
    if (!busData.bus_number || !busData.registration_number) {
      throw new Error('Bus number and registration number are required');
    }

    return await busModel.create(busData);
  } catch (error) {
    throw new Error(`Failed to create bus: ${error.message}`);
  }
};

/**
 * Update bus
 * @param {number} id - Bus ID
 * @param {Object} busData - Updated bus data
 * @returns {Promise<Object>} Updated bus
 */
export const updateBus = async (id, busData) => {
  try {
    const existing = await busModel.findById(id);
    if (!existing) {
      throw new Error('Bus not found');
    }

    return await busModel.update(id, busData);
  } catch (error) {
    throw new Error(`Failed to update bus: ${error.message}`);
  }
};

/**
 * Delete bus
 * @param {number} id - Bus ID
 * @returns {Promise<void>}
 */
export const deleteBus = async (id) => {
  try {
    const bus = await busModel.findById(id);
    if (!bus) {
      throw new Error('Bus not found');
    }
    await busModel.remove(id);
  } catch (error) {
    throw new Error(`Failed to delete bus: ${error.message}`);
  }
};

/**
 * Get buses with expiring documents
 * @param {number} months - Number of months before expiration (default: 2)
 * @returns {Promise<Array>} List of buses with expiring documents and alert details
 */
export const getBusesWithExpiringDocuments = async (months = 2) => {
  try {
    const buses = await busModel.findBusesWithExpiringDocuments(months);
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + months);

    // Add alert information to each bus
    return buses.map(bus => {
      const alerts = [];
      
      // Check insurance expiry
      if (bus.insurance_expiry) {
        const expiryDate = new Date(bus.insurance_expiry);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        if (expiryDate <= now) {
          alerts.push({
            type: 'insurance',
            message: 'Insurance has expired',
            expiryDate: bus.insurance_expiry,
            daysUntilExpiry: 0,
            severity: 'critical'
          });
        } else if (expiryDate <= oneMonthFromNow) {
          alerts.push({
            type: 'insurance',
            message: `Insurance expires in ${daysUntilExpiry} day(s)`,
            expiryDate: bus.insurance_expiry,
            daysUntilExpiry,
            severity: 'urgent'
          });
        } else if (expiryDate <= twoMonthsFromNow) {
          alerts.push({
            type: 'insurance',
            message: `Insurance expires in ${daysUntilExpiry} day(s)`,
            expiryDate: bus.insurance_expiry,
            daysUntilExpiry,
            severity: 'warning'
          });
        }
      }

      // Check FC expiry
      if (bus.fc_expiry) {
        const expiryDate = new Date(bus.fc_expiry);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        if (expiryDate <= now) {
          alerts.push({
            type: 'fc',
            message: 'Fitness Certificate has expired',
            expiryDate: bus.fc_expiry,
            daysUntilExpiry: 0,
            severity: 'critical'
          });
        } else if (expiryDate <= oneMonthFromNow) {
          alerts.push({
            type: 'fc',
            message: `Fitness Certificate expires in ${daysUntilExpiry} day(s)`,
            expiryDate: bus.fc_expiry,
            daysUntilExpiry,
            severity: 'urgent'
          });
        } else if (expiryDate <= twoMonthsFromNow) {
          alerts.push({
            type: 'fc',
            message: `Fitness Certificate expires in ${daysUntilExpiry} day(s)`,
            expiryDate: bus.fc_expiry,
            daysUntilExpiry,
            severity: 'warning'
          });
        }
      }

      // Check permit expiry
      if (bus.permit_expiry) {
        const expiryDate = new Date(bus.permit_expiry);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        if (expiryDate <= now) {
          alerts.push({
            type: 'permit',
            message: 'Permit has expired',
            expiryDate: bus.permit_expiry,
            daysUntilExpiry: 0,
            severity: 'critical'
          });
        } else if (expiryDate <= oneMonthFromNow) {
          alerts.push({
            type: 'permit',
            message: `Permit expires in ${daysUntilExpiry} day(s)`,
            expiryDate: bus.permit_expiry,
            daysUntilExpiry,
            severity: 'urgent'
          });
        } else if (expiryDate <= twoMonthsFromNow) {
          alerts.push({
            type: 'permit',
            message: `Permit expires in ${daysUntilExpiry} day(s)`,
            expiryDate: bus.permit_expiry,
            daysUntilExpiry,
            severity: 'warning'
          });
        }
      }

      return {
        ...bus,
        alerts
      };
    });
  } catch (error) {
    throw new Error(`Failed to fetch buses with expiring documents: ${error.message}`);
  }
};
