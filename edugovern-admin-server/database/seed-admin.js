import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST before importing any modules that use them
dotenv.config({ path: join(__dirname, '../.env') });

import bcrypt from 'bcrypt';
import pool from '../src/config/mysql.config.js';

/**
 * Seed script to create a test admin
 * Run this script to create an admin user for testing
 * Usage: node database/seed-admin.js
 */

const seedAdmin = async () => {
  try {
    const adminId = 'ADMIN001';
    const name = 'System Administrator';
    const plainPassword = 'admin123';

    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Check if admin already exists
    const [existing] = await pool.execute(
      'SELECT * FROM admins WHERE admin_id = ?',
      [adminId]
    );

    if (existing.length > 0) {
      console.log('Admin already exists. Updating password...');
      await pool.execute(
        'UPDATE admins SET password = ? WHERE admin_id = ?',
        [hashedPassword, adminId]
      );
      console.log('✅ Admin password updated successfully');
      console.log(`Admin ID: ${adminId}`);
      console.log(`Password: ${plainPassword}`);
    } else {
      // Insert new admin
      await pool.execute(
        'INSERT INTO admins (admin_id, name, password) VALUES (?, ?, ?)',
        [adminId, name, hashedPassword]
      );
      console.log('✅ Admin created successfully');
      console.log(`Admin ID: ${adminId}`);
      console.log(`Password: ${plainPassword}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();

