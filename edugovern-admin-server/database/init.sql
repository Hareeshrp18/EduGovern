-- EduGovern Database Initialization Script

-- Create database
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


INSERT INTO admins (admin_id, name, password) 
VALUES (
    'ADMIN001',
    'System Administrator',
    '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq'
) ON DUPLICATE KEY UPDATE admin_id=admin_id;



