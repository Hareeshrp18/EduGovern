-- Create exams table for managing exams for specific classes
-- This table stores exam definitions that can be linked to classes and subjects

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
