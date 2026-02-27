import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';


if (!process.env.DB_PASSWORD) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const envPath = join(__dirname, '../../.env');
  
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(' Fallback: Loaded .env from mysql.config.js');
  }
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'edugovern',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00', // Force UTC timezone to prevent date conversion issues
  dateStrings: true   // Return dates as strings instead of Date objects
};

// Log configuration (without password) for debugging
console.log('   Database Configuration:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   Password: ${dbConfig.password ? '***' : 'NOT SET'}`);
console.log(`   DB_PASSWORD from env: ${process.env.DB_PASSWORD ? 'SET' : 'NOT SET'}`);

const pool = mysql.createPool(dbConfig);

export const initializeDatabase = async () => {
  try {
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
    
    try {
      await connection.execute(`DROP TABLE IF EXISTS admins`);
    } catch (e) {
      
    }
    
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
    console.log(' Students table created successfully');

    try {
      await connection.execute(`CREATE TABLE IF NOT EXISTS buses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        bus_number VARCHAR(50) NOT NULL UNIQUE,
        registration_number VARCHAR(50) NOT NULL UNIQUE,
        driver_name VARCHAR(255) NULL,
        driver_contact VARCHAR(20) NULL,
        route_name VARCHAR(255) NULL,
        capacity INT NULL,
        insurance_expiry DATE NULL,
        fc_expiry DATE NULL,
        permit_expiry DATE NULL,
        images TEXT NULL,
        status ENUM('Active', 'Inactive', 'Under Maintenance') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      console.log(" Buses table verified/created (includes 'images' column)");

      try {
        await connection.execute(`ALTER TABLE buses ADD COLUMN IF NOT EXISTS images TEXT NULL`);
      } catch (e) {
        try {
          await connection.execute(`ALTER TABLE buses ADD COLUMN images TEXT NULL`);
        } catch (err) {
        }
      }
    } catch (e) {
      console.error('Bus table check/create error:', e.message);
    }

    // Create exams table if it doesn't exist
    try {
      // First check if classes and subjects tables exist
      const [tables] = await connection.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME IN ('classes', 'subjects')
      `, [dbConfig.database]);
      
      const tableNames = tables.map(t => t.TABLE_NAME);
      
      // Create classes table if it doesn't exist
      if (!tableNames.includes('classes')) {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS classes (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(50) NOT NULL UNIQUE,
            display_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log(' Classes table created');
      }
      
      // Create subjects table if it doesn't exist
      if (!tableNames.includes('subjects')) {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS subjects (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            class_id INT NOT NULL,
            display_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            INDEX idx_class_id (class_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log(' Subjects table created');
      }
      
      // Now create exams table
      await connection.execute(`CREATE TABLE IF NOT EXISTS exams (
        id INT PRIMARY KEY AUTO_INCREMENT,
        class_id INT NOT NULL,
        subject_id INT NULL,
        exam_type VARCHAR(50) NOT NULL DEFAULT 'Assignment',
        exam_date DATE NULL,
        max_marks DECIMAL(5,2) DEFAULT 100.00,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
        INDEX idx_class_id (class_id),
        INDEX idx_subject_id (subject_id),
        INDEX idx_exam_date (exam_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      console.log(' Exams table verified/created');
    } catch (e) {
      console.error('Exams table check/create error:', e.message);
      console.error('Error details:', e);
    }
    
    connection.release();
    await tempPool.end();
    return true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    return false;
  }
};

export const testConnection = async () => {
  try {
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

