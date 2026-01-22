-- Create bus_maintenance table for tracking bus maintenance records
CREATE TABLE IF NOT EXISTS bus_maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_id INT NOT NULL,
  maintenance_date DATE NOT NULL,
  maintenance_type VARCHAR(100) NOT NULL,
  description TEXT NULL,
  cost DECIMAL(10, 2) NULL,
  service_provider VARCHAR(255) NULL,
  next_maintenance_date DATE NULL,
  odometer_reading INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
  INDEX idx_bus (bus_id),
  INDEX idx_date (maintenance_date),
  INDEX idx_type (maintenance_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
