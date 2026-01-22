-- Create EduGovern Database
-- Run this script in MySQL to create the database and admin table

CREATE DATABASE IF NOT EXISTS edugovern;
USE edugovern;

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verify table creation
SELECT 'Database and table created successfully!' AS Status;

