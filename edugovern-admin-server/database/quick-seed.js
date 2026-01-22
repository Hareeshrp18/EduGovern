import bcrypt from 'bcrypt';
import pool from '../src/config/mysql.config.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Quick seed script - creates admin user immediately
 */
const quickSeed = async () => {
  try {
    const adminId = 'ADMIN001';
    const name = 'System Administrator';
    const plainPassword = 'admin123';

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    console.log('📝 Creating admin user...');
    
    // Delete existing admin if any
    await pool.execute('DELETE FROM admins WHERE admin_id = ?', [adminId]);
    
    // Insert new admin
    await pool.execute(
      'INSERT INTO admins (admin_id, name, password) VALUES (?, ?, ?)',
      [adminId, name, hashedPassword]
    );

    console.log('✅ Admin created successfully!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   Admin ID: ADMIN001');
    console.log('   Password: admin123');
    console.log('\n✅ Ready for demo!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🔧 Make sure:');
    console.error('   1. MySQL is running');
    console.error('   2. Database "edugovern" exists');
    console.error('   3. Table "admins" exists');
    process.exit(1);
  }
};

quickSeed();

