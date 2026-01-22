import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Note: dotenv should already be loaded in server.js before this module is imported
// But we'll try to load it here as a fallback if needed
if (!process.env.DB_PASSWORD) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const envPath = join(__dirname, '../../.env');
  
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('⚠️  Fallback: Loaded .env from mysql.config.js');
  }
}

// Validate required environment variables
// Note: XAMPP MySQL may have empty password by default
// If DB_PASSWORD is empty string, MySQL will try to connect without password
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'edugovern',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Log configuration (without password) for debugging
console.log('📋 Database Configuration:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   Password: ${dbConfig.password ? '***' : 'NOT SET'}`);
console.log(`   DB_PASSWORD from env: ${process.env.DB_PASSWORD ? 'SET' : 'NOT SET'}`);

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Create database if it doesn't exist
export const initializeDatabase = async () => {
  try {
    // First, connect without specifying database
    const tempConfig = {
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    
    const tempPool = mysql.createPool(tempConfig);
    const connection = await tempPool.getConnection();
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    console.log(`Database '${dbConfig.database}' verified/created`);
    
    // Create admins table
    await connection.execute(`USE \`${dbConfig.database}\``);
    
    // Drop and recreate table to ensure correct structure
    try {
      await connection.execute(`DROP TABLE IF EXISTS admins`);
    } catch (e) {
      // Ignore errors
    }
    
    // Create admins table with correct structure (including password reset fields)
    await connection.execute(`
      CREATE TABLE admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        admin_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255) DEFAULT NULL,
        reset_token_expiry DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log(' Admins table created successfully');
    
    // Create students table
    try {
      await connection.execute(`DROP TABLE IF EXISTS students`);
    } catch (e) {
      // Ignore errors
    }
    
    await connection.execute(`
      CREATE TABLE students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        date_of_birth DATE,
        gender ENUM('Male', 'Female', 'Other'),
        address TEXT,
        class VARCHAR(50),
        section VARCHAR(10),
        academic_year VARCHAR(20),
        admission_date DATE,
        blood_group VARCHAR(10),
        father_name VARCHAR(100),
        mother_name VARCHAR(100),
        primary_contact VARCHAR(20),
        secondary_contact VARCHAR(20),
        aadhar_no VARCHAR(20),
        annual_income DECIMAL(12, 2),
        parent_name VARCHAR(100),
        parent_phone VARCHAR(20),
        parent_email VARCHAR(100),
        photo VARCHAR(255),
        status ENUM('Active', 'Inactive', 'Graduated', 'Transferred') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Students table created successfully');
    
    connection.release();
    await tempPool.end();
    return true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    return false;
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    // First initialize database
    await initializeDatabase();
    
    // Then test the actual connection with database
    const connection = await pool.getConnection();
    console.log(' MySQL database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('MySQL connection error:', error.message);
    return false;
  }
};

export default pool;

