-- Create buses/vehicles table for transport management
CREATE TABLE IF NOT EXISTS buses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_number VARCHAR(50) NOT NULL UNIQUE,
  registration_number VARCHAR(50) NOT NULL UNIQUE,
  driver_name VARCHAR(255) NULL,
  driver_contact VARCHAR(20) NULL,
  route_name VARCHAR(255) NULL,
  capacity INT NULL,
  insurance_expiry DATE NULL,
  fc_expiry DATE NULL,
  permit_expiry DATE NULL,
  status ENUM('Active', 'Inactive', 'Under Maintenance') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
