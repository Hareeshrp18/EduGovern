import * as requestModel from './request.model.js';

/**
 * Request Service - Business logic for requests
 */

/**
 * Get all requests with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of requests
 */
export const getAllRequests = async (filters = {}) => {
  try {
    return await requestModel.findAll(filters);
  } catch (error) {
    throw new Error(`Failed to fetch requests: ${error.message}`);
  }
};

/**
 * Get request by ID
 * @param {number} id - Request ID
 * @returns {Promise<Object>} Request data
 */
export const getRequestById = async (id) => {
  try {
    const request = await requestModel.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }
    return request;
  } catch (error) {
    throw new Error(`Failed to fetch request: ${error.message}`);
  }
};

/**
 * Create a new request
 * @param {Object} requestData - Request data
 * @returns {Promise<Object>} Created request
 */
export const createRequest = async (requestData) => {
  try {
    // Validate required fields
    if (!requestData.request_type || !requestData.requester_type || !requestData.requester_id) {
      throw new Error('Request type, requester type, and requester ID are required');
    }

    if (!requestData.subject || !requestData.description) {
      throw new Error('Subject and description are required');
    }

    if (!requestData.requester_name) {
      throw new Error('Requester name is required');
    }

    // Calculate duration_days if start_date and end_date are provided
    if (requestData.start_date && requestData.end_date) {
      const start = new Date(requestData.start_date);
      const end = new Date(requestData.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      requestData.duration_days = diffDays;
    }

    return await requestModel.create(requestData);
  } catch (error) {
    throw new Error(`Failed to create request: ${error.message}`);
  }
};

/**
 * Update request status (approve/reject)
 * @param {number} id - Request ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated request
 */
export const updateRequestStatus = async (id, updateData) => {
  try {
    const request = await requestModel.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    if (!['Approved', 'Rejected', 'Cancelled'].includes(updateData.status)) {
      throw new Error('Invalid status. Must be Approved, Rejected, or Cancelled');
    }

    // Cannot change status if already reviewed (unless cancelling)
    if (request.status !== 'Pending' && updateData.status !== 'Cancelled') {
      throw new Error(`Cannot change status from ${request.status} to ${updateData.status}`);
    }

    return await requestModel.updateStatus(id, updateData);
  } catch (error) {
    throw new Error(`Failed to update request status: ${error.message}`);
  }
};

/**
 * Update request
 * @param {number} id - Request ID
 * @param {Object} requestData - Updated request data
 * @returns {Promise<Object>} Updated request
 */
export const updateRequest = async (id, requestData) => {
  try {
    const request = await requestModel.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    // Cannot update if already reviewed
    if (request.status !== 'Pending') {
      throw new Error('Cannot update request that has already been reviewed');
    }

    // Recalculate duration if dates are updated
    if (requestData.start_date && requestData.end_date) {
      const start = new Date(requestData.start_date);
      const end = new Date(requestData.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      requestData.duration_days = diffDays;
    }

    return await requestModel.update(id, requestData);
  } catch (error) {
    throw new Error(`Failed to update request: ${error.message}`);
  }
};

/**
 * Delete request
 * @param {number} id - Request ID
 * @returns {Promise<void>}
 */
export const deleteRequest = async (id) => {
  try {
    const request = await requestModel.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }
    await requestModel.remove(id);
  } catch (error) {
    throw new Error(`Failed to delete request: ${error.message}`);
  }
};

/**
 * Get request statistics
 * @returns {Promise<Object>} Request statistics
 */
export const getRequestStatistics = async () => {
  try {
    return await requestModel.getStatistics();
  } catch (error) {
    throw new Error(`Failed to fetch request statistics: ${error.message}`);
  }
};
