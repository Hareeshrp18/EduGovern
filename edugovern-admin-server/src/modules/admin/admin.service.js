import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findByAdminId } from './admin.model.js';
import { jwtConfig } from '../../config/jwt.config.js';

/**
 * Admin Service - Business logic for admin operations
 */

/**
 * Login service - Validate admin credentials and generate JWT token
 * @param {string} adminId - Admin ID
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} Token and admin data
 * @throws {Error} If credentials are invalid
 */
export const login = async (adminId, password) => {
  // Validate input
  if (!adminId || !password) {
    throw new Error('Admin ID and password are required');
  }

  // Find admin by admin_id
  const admin = await findByAdminId(adminId);
  if (!admin) {
    throw new Error('Invalid admin ID or password');
  }

  // Verify password using bcrypt
  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    throw new Error('Invalid admin ID or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      id: admin.id,
      admin_id: admin.admin_id,
      role: 'admin'
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );

  // Return token and admin info (exclude password)
  return {
    token,
    admin: {
      id: admin.id,
      admin_id: admin.admin_id,
      name: admin.name,
      created_at: admin.created_at
    }
  };
};

