import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { findByAdminId, findByResetToken, updateResetToken, updatePassword } from './admin.model.js';
import { sendPasswordResetEmail } from '../../config/email.config.js';

/**
 * Password Reset Service - Business logic for password reset operations
 */

/**
 * Generate secure random token for password reset
 * @returns {string} Random token
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Forgot password service
 * @param {string} adminId - Admin ID
 * @returns {Promise<void>}
 * @throws {Error} If admin not found or email send fails
 */
export const forgotPassword = async (adminId) => {
  // Validate input
  if (!adminId) {
    throw new Error('Admin ID is required');
  }

  // Find admin by admin_id
  const admin = await findByAdminId(adminId);
  
  // Security: Don't reveal if admin exists or not
  // Always return success message to prevent user enumeration
  if (!admin) {
    // Return success even if admin doesn't exist (security best practice)
    return { message: 'If an account exists with this Admin ID, a password reset link has been sent.' };
  }

  // Generate reset token
  const resetToken = generateResetToken();
  
  // Set expiry to 15 minutes from now
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + 15);

  // Update admin with reset token
  await updateResetToken(adminId, resetToken, expiryDate);

  // Generate reset link
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/reset-password?token=${resetToken}`;

  // Send email (if email is configured)
  // For demo purposes, we'll log the link if email fails
  try {
    // In production, admin should have an email field
    // For now, we'll use a placeholder or log the link
    const adminEmail = process.env.ADMIN_EMAIL || admin.email || 'admin@edugovern.com';
    await sendPasswordResetEmail(adminEmail, resetLink);
  } catch (error) {
    // Log the reset link for development/demo purposes
    console.log('📧 Email not configured. Reset link for demo:');
    console.log(`   ${resetLink}`);
    console.log('   (In production, this would be sent via email)');
  }

  return {
    message: 'If an account exists with this Admin ID, a password reset link has been sent.'
  };
};

/**
 * Reset password service
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 * @throws {Error} If token invalid, expired, or password update fails
 */
export const resetPassword = async (token, newPassword) => {
  // Validate input
  if (!token || !newPassword) {
    throw new Error('Token and new password are required');
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Find admin by reset token (token must be valid and not expired)
  const admin = await findByResetToken(token);
  if (!admin) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset token
  await updatePassword(admin.id, hashedPassword);

  return {
    message: 'Password has been reset successfully'
  };
};

