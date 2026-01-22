import { forgotPassword as forgotPasswordService, resetPassword as resetPasswordService } from './passwordReset.service.js';

/**
 * Password Reset Controller - Request/response handling for password reset operations
 */

/**
 * Handle forgot password request
 * POST /api/admin/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { admin_id } = req.body;

    // Validate input
    if (!admin_id) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    // Call service to handle forgot password
    const result = await forgotPasswordService(admin_id);

    // Return success response (don't reveal if admin exists)
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process password reset request'
    });
  }
};

/**
 * Handle reset password request
 * POST /api/admin/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Call service to handle password reset
    const result = await resetPasswordService(token, newPassword);

    // Return success response
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    // Handle errors
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
};

