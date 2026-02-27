import * as requestService from './request.service.js';

/**
 * Request Controller - Request/response handling for request operations
 */

/**
 * Get all requests
 * GET /api/admin/requests
 */
export const getAllRequests = async (req, res) => {
  try {
    const { status, request_type, requester_type, requester_id } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (request_type) filters.request_type = request_type;
    if (requester_type) filters.requester_type = requester_type;
    if (requester_id) filters.requester_id = requester_id;

    const requests = await requestService.getAllRequests(filters);
    
    res.status(200).json({
      success: true,
      message: 'Requests fetched successfully',
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch requests'
    });
  }
};

/**
 * Get request by ID
 * GET /api/admin/requests/:id
 */
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await requestService.getRequestById(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Request fetched successfully',
      data: request
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch request'
    });
  }
};

/**
 * Create a new request
 * POST /api/admin/requests
 */
export const createRequest = async (req, res) => {
  try {
    const request = await requestService.createRequest(req.body);
    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create request'
    });
  }
};

/**
 * Update request status (approve/reject)
 * PATCH /api/admin/requests/:id/status
 */
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_comment } = req.body;
    const admin = req.user; // From auth middleware

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updateData = {
      status,
      admin_comment: admin_comment || null,
      admin_id: admin?.admin_id || null,
      admin_name: admin?.name || null
    };

    const request = await requestService.updateRequestStatus(parseInt(id), updateData);
    res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      data: request
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update request status'
    });
  }
};

/**
 * Update request
 * PUT /api/admin/requests/:id
 */
export const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await requestService.updateRequest(parseInt(id), req.body);
    res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      data: request
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update request'
    });
  }
};

/**
 * Delete request
 * DELETE /api/admin/requests/:id
 */
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await requestService.deleteRequest(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete request'
    });
  }
};

/**
 * Get request statistics
 * GET /api/admin/requests/statistics
 */
export const getRequestStatistics = async (req, res) => {
  try {
    const statistics = await requestService.getRequestStatistics();
    res.status(200).json({
      success: true,
      message: 'Statistics fetched successfully',
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics'
    });
  }
};
