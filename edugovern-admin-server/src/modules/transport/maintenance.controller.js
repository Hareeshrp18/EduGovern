import {
  getMaintenanceByBusId,
  getMaintenanceByDateRange,
  getMaintenanceByMonth,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance
} from './maintenance.service.js';

/**
 * Maintenance Controller - HTTP request handlers for bus maintenance
 */

/**
 * Get all maintenance records for a bus
 * GET /api/transport/maintenance/bus/:busId
 */
export const getBusMaintenance = async (req, res) => {
  try {
    const { busId } = req.params;
    const { startDate, endDate, year, month } = req.query;

    let records;
    if (startDate && endDate) {
      records = await getMaintenanceByDateRange(parseInt(busId), startDate, endDate);
    } else if (year && month) {
      records = await getMaintenanceByMonth(parseInt(busId), parseInt(year), parseInt(month));
    } else {
      records = await getMaintenanceByBusId(parseInt(busId));
    }

    res.status(200).json({
      success: true,
      message: 'Maintenance records fetched successfully',
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch maintenance records'
    });
  }
};

/**
 * Get maintenance record by ID
 * GET /api/transport/maintenance/:id
 */
export const getMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await getMaintenanceById(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Maintenance record fetched successfully',
      data: record
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || 'Maintenance record not found'
    });
  }
};

/**
 * Create a new maintenance record
 * POST /api/transport/maintenance
 */
export const createMaintenanceRecord = async (req, res) => {
  try {
    const record = await createMaintenance(req.body);

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create maintenance record'
    });
  }
};

/**
 * Update maintenance record
 * PUT /api/transport/maintenance/:id
 */
export const updateMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await updateMaintenance(parseInt(id), req.body);

    res.status(200).json({
      success: true,
      message: 'Maintenance record updated successfully',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update maintenance record'
    });
  }
};

/**
 * Delete maintenance record
 * DELETE /api/transport/maintenance/:id
 */
export const deleteMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteMaintenance(parseInt(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Maintenance record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete maintenance record'
    });
  }
};
