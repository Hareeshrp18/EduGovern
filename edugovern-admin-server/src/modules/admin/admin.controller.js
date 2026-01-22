import { login as loginService } from './admin.service.js';

/**
 * Admin Controller - Request/response handling for admin operations
 */

/**
 * Handle admin login
 * POST /api/admin/login
 */
export const login = async (req, res) => {
  try {
    const { admin_id, password } = req.body;

    // Validate input
    if (!admin_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID and password are required'
      });
    }

    // Call service to handle login
    const result = await loginService(admin_id, password);

    // Return success response with token and admin data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    // Handle service errors
    // Check if it's a database connection error
    if (error.message && error.message.includes('Database error')) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Database connection error. Please check MySQL is running and credentials are correct.'
      });
    }
    
    // Handle authentication errors
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

