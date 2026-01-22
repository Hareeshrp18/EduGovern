import * as busService from './bus.service.js';

/**
 * Bus Controller - Request/response handling for bus operations
 */

/**
 * Get all buses
 * GET /api/transport/buses
 */
export const getAllBuses = async (req, res) => {
  try {
    const buses = await busService.getAllBuses();
    res.status(200).json({
      success: true,
      message: 'Buses fetched successfully',
      data: buses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch buses'
    });
  }
};

/**
 * Get bus by ID
 * GET /api/transport/buses/:id
 */
export const getBusById = async (req, res) => {
  try {
    const { id } = req.params;
    const bus = await busService.getBusById(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Bus fetched successfully',
      data: bus
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch bus'
    });
  }
};

/**
 * Create bus
 * POST /api/transport/buses
 */
export const createBus = async (req, res) => {
  try {
    const bus = await busService.createBus(req.body);
    res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      data: bus
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create bus'
    });
  }
};

/**
 * Update bus
 * PUT /api/transport/buses/:id
 */
export const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const bus = await busService.updateBus(parseInt(id), req.body);
    res.status(200).json({
      success: true,
      message: 'Bus updated successfully',
      data: bus
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update bus'
    });
  }
};

/**
 * Delete bus
 * DELETE /api/transport/buses/:id
 */
export const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;
    await busService.deleteBus(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete bus'
    });
  }
};

/**
 * Get buses with expiring documents (alerts)
 * GET /api/transport/buses/alerts
 */
export const getBusesWithExpiringDocuments = async (req, res) => {
  try {
    const { months = 2 } = req.query;
    const buses = await busService.getBusesWithExpiringDocuments(parseInt(months));
    res.status(200).json({
      success: true,
      message: 'Buses with expiring documents fetched successfully',
      data: buses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch buses with expiring documents'
    });
  }
};
