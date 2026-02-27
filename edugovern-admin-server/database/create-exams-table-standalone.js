import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, '../.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'edugovern'
};

async function createExamsTable() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected successfully!');

    // Check if classes and subjects tables exist first
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('classes', 'subjects')
    `, [dbConfig.database]);

    const tableNames = tables.map(t => t.TABLE_NAME);
    
    if (!tableNames.includes('classes')) {
      console.log('Warning: classes table does not exist. Creating it first...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS classes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(50) NOT NULL UNIQUE,
          display_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('Classes table created.');
    }

    if (!tableNames.includes('subjects')) {
      console.log('Warning: subjects table does not exist. Creating it first...');
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
      console.log('Subjects table created.');
    }

    // Now create exams table
    console.log('Creating exams table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exams (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    console.log('✅ Exams table created successfully!');
    
    // Verify table exists
    const [verify] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'exams'
    `, [dbConfig.database]);
    
    if (verify[0].count > 0) {
      console.log('✅ Verification: exams table exists in database.');
    }
    
  } catch (error) {
    console.error('❌ Error creating exams table:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

createExamsTable();
