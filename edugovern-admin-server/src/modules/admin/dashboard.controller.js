import * as dashboardService from './dashboard.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';

/**
 * Dashboard Controller - Request/response handling for dashboard operations
 */

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.status(200).json({
      success: true,
      message: 'Dashboard statistics fetched successfully',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard statistics'
    });
  }
};
