-- Create faculty table
CREATE TABLE IF NOT EXISTS faculty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE NULL,
  designation VARCHAR(100) NULL,
  experience INT NULL,
  contact VARCHAR(20) NULL,
  email VARCHAR(255) NULL UNIQUE,
  address TEXT NULL,
  salary DECIMAL(10, 2) NULL,
  class VARCHAR(50) NULL,
  section VARCHAR(10) NULL,
  qualification VARCHAR(255) NULL,
  joining_date DATE NULL,
  photo VARCHAR(255) NULL,
  status ENUM('Active', 'Inactive', 'Retired') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
