import * as studentModel from './student.model.js';
import pool from '../../config/mysql.config.js';
import bcrypt from 'bcrypt';

/**
 * Student Service - Business logic for student operations
 */

/**
 * Format date as ddmmyy (date of birth format for student password)
 * @param {string} dateStr - ISO date YYYY-MM-DD
 * @returns {string|null} ddmmyy or null
 */
const formatDdmmyy = (dateStr) => {
  if (!dateStr) return null;
  
  // Handle yyyy-MM-dd format directly without timezone conversion
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}${month}${year.slice(-2)}`;
  }
  
  return null;
};

/**
 * Get all students
 * @returns {Promise<Array>} List of students
 */
export const getAllStudents = async () => {
  const students = await studentModel.findAll();
  
  // With dateStrings: true in MySQL config, dates should already be strings
  // No conversion needed
  return students;
};

/**
 * Get student by ID
 * @param {number} id - Student ID
 * @returns {Promise<Object>} Student record
 */
export const getStudentById = async (id) => {
  const student = await studentModel.findById(id);
  if (!student) {
    throw new Error('Student not found');
  }
  
  // With dateStrings: true in MySQL config, date_of_birth should already be a string
  // in YYYY-MM-DD format, no conversion needed
  return student;
};

/**
 * Generate student ID in sequential format: 1@sks, 2@sks, etc.
 * @returns {Promise<string>} Generated student ID
 */
const generateSequentialStudentId = async () => {
  try {
    const [rows] = await pool.execute(
      `SELECT student_id FROM students 
       WHERE student_id REGEXP '^[0-9]+@sks$'
       ORDER BY CAST(SUBSTRING_INDEX(student_id, '@', 1) AS UNSIGNED) DESC
       LIMIT 1`
    );
    
    if (rows.length === 0) return '1@sks';
    
    const lastId = rows[0].student_id;
    const lastNumber = parseInt(lastId.split('@')[0], 10);
    return `${lastNumber + 1}@sks`;
  } catch (error) {
    throw new Error(`Failed to generate student ID: ${error.message}`);
  }
};

/**
 * Generate roll number in format STUD{class}{rollno}@sks
 * @param {string} className - Class name (e.g., "10", "9", "LKG")
 * @param {number} rollNo - Roll number
 * @returns {string} Generated roll number
 */
const generateRollNumber = (className, rollNo) => {
  const cleanClass = (className || '').replace(/[^a-zA-Z0-9]/g, '');
  return `STUD${cleanClass}${rollNo}@sks`;
};

/**
 * Create a new student
 * @param {Object} studentData - Student data
 * @returns {Promise<Object>} Created student
 */
export const createStudent = async (studentData) => {
  // Validate required fields
  if (!studentData.name) {
    throw new Error('Student name is required');
  }

  if (!studentData.class) {
    throw new Error('Class is required');
  }

  console.log('Create student data received:', studentData);

  // Generate sequential student_id (1@sks, 2@sks, etc.) if not provided
  let studentId;
  if (studentData.student_id && studentData.student_id.trim()) {
    // Use provided student_id
    studentId = studentData.student_id.trim();
    // Check if it already exists
    const existing = await studentModel.findByStudentId(studentId);
    if (existing) {
      throw new Error(`Student ID ${studentId} already exists.`);
    }
  } else {
    // Auto-generate
    studentId = await generateSequentialStudentId();
  }
  console.log('Student ID:', studentId);

  // Generate student password from date of birth (ddmmyy format)
  let studentPasswordHash = null;
  if (studentData.date_of_birth) {
    const plainPassword = formatDdmmyy(studentData.date_of_birth);
    if (plainPassword) {
      studentPasswordHash = await bcrypt.hash(plainPassword, 10);
      console.log(`Student password generated from DOB: ${studentData.date_of_birth} -> ${plainPassword} (hashed)`);
    }
  }

  // Handle roll_no
  let rollNo;
  if (studentData.roll_no && studentData.roll_no.trim()) {
    // Use provided roll_no
    rollNo = studentData.roll_no.trim();
  } else {
    // Auto-generate roll number based on alphabetical order
    const classStudents = await studentModel.findByClass(studentData.class);
    const allStudents = [...classStudents, { name: studentData.name }];
    allStudents.sort((a, b) => a.name.localeCompare(b.name));
    const rollNoValue = allStudents.findIndex(s => s.name === studentData.name) + 1;
    rollNo = generateRollNumber(studentData.class, rollNoValue);
  }
  console.log('Roll number:', rollNo);

  // Add student_id, roll_no, and password to the data
  const dataWithId = {
    ...studentData,
    student_id: studentId,
    roll_no: rollNo,
    student_password: studentPasswordHash
  };

  return await studentModel.create(dataWithId);
};

/**
 * Update student
 * @param {number} id - Student ID
 * @param {Object} studentData - Updated student data
 * @returns {Promise<Object>} Updated student
 */
export const updateStudent = async (id, studentData) => {
  // Check if student exists
  const existing = await studentModel.findById(id);
  if (!existing) {
    throw new Error('Student not found');
  }

  console.log('Update student data received:', studentData);
  console.log('Existing student:', existing);

  // Handle student_id - can be manually edited with validation
  if (studentData.student_id && studentData.student_id.trim()) {
    const trimmedStudentId = studentData.student_id.trim();
    
    // If student_id changed, validate it's unique
    if (trimmedStudentId !== existing.student_id) {
      const existingWithNewId = await studentModel.findByStudentId(trimmedStudentId);
      if (existingWithNewId && existingWithNewId.id !== id) {
        throw new Error(`Student ID ${trimmedStudentId} already exists. Please use a different ID.`);
      }
      
      // Validate format (should be like 1@sks, 2@sks, etc.)
      const studentIdPattern = /^\d+@sks$/;
      if (!studentIdPattern.test(trimmedStudentId)) {
        throw new Error('Student ID must be in format: number@sks (e.g., 1@sks, 2@sks)');
      }
      
      studentData.student_id = trimmedStudentId;
      console.log(`Student ID updated: ${existing.student_id} -> ${trimmedStudentId}`);
      console.log('Note: Foreign key relationships will be updated automatically via CASCADE');
    } else {
      // No change to student_id
      studentData.student_id = existing.student_id;
    }
  } else {
    // Keep existing student_id if not provided
    studentData.student_id = existing.student_id;
  }

  // Handle roll_no - can be manually edited or auto-generated
  if (studentData.roll_no && studentData.roll_no.trim()) {
    // Roll number was manually provided
    studentData.roll_no = studentData.roll_no.trim();
    console.log(`Roll number manually set: ${studentData.roll_no}`);
  } else {
    // Auto-generate roll_no if class changed or if it's currently NULL
    const classChanged = studentData.class && studentData.class !== existing.class;
    
    if (classChanged || !existing.roll_no) {
      const newClass = studentData.class || existing.class;
      
      // Extract roll number value from existing roll_no if it exists
      let rollNoValue = 1;
      if (existing.roll_no) {
        const match = existing.roll_no.match(/STUD[^0-9]*(\d+)@sks$/);
        if (match) {
          rollNoValue = parseInt(match[1], 10);
        }
      } else {
        // Auto-generate based on alphabetical order
        const classStudents = await studentModel.findByClass(newClass);
        const allStudents = [...classStudents.filter(s => s.id !== id), { name: studentData.name || existing.name }];
        allStudents.sort((a, b) => a.name.localeCompare(b.name));
        rollNoValue = allStudents.findIndex(s => s.name === (studentData.name || existing.name)) + 1;
      }

      const newRollNo = generateRollNumber(newClass, rollNoValue);
      studentData.roll_no = newRollNo;
      console.log(`Roll number auto-generated: ${existing.roll_no || 'NULL'} -> ${newRollNo}`);
    } else {
      // Keep existing roll_no
      studentData.roll_no = existing.roll_no;
      console.log('Roll number unchanged:', existing.roll_no);
    }
  }

  // Handle password update when date of birth changes
  let studentPasswordHash = existing.student_password; // Keep existing by default
  
  // Format date_of_birth to yyyy-MM-dd if it exists (avoid timezone conversion)
  if (studentData.date_of_birth) {
    // If it's already in yyyy-MM-dd format, use it directly
    if (typeof studentData.date_of_birth === 'string' && studentData.date_of_birth.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Already in correct format, no conversion needed
      console.log('Date already in correct format:', studentData.date_of_birth);
    } else {
      // Convert to yyyy-MM-dd format without timezone issues
      const date = new Date(studentData.date_of_birth + 'T12:00:00'); // Use noon to avoid timezone shift
      if (!isNaN(date.getTime())) {
        studentData.date_of_birth = date.toISOString().split('T')[0];
        console.log('Date converted to:', studentData.date_of_birth);
      } else {
        console.log('Invalid date format, keeping original:', studentData.date_of_birth);
      }
    }
    
    // Check if date of birth changed and update password accordingly
    // With dateStrings: true, existing.date_of_birth is already a string in YYYY-MM-DD format
    const existingDob = existing.date_of_birth || null;
    
    if (studentData.date_of_birth !== existingDob) {
      // Date of birth changed - update password
      const plainPassword = formatDdmmyy(studentData.date_of_birth);
      if (plainPassword) {
        studentPasswordHash = await bcrypt.hash(plainPassword, 10);
        console.log(`Date of birth changed: ${existingDob} -> ${studentData.date_of_birth}`);
        console.log(`Student password updated: ${plainPassword} (hashed)`);
      }
    }
  }
  
  // Add password to update data
  studentData.student_password = studentPasswordHash;

  console.log('Final data to update:', { 
    student_id: studentData.student_id, 
    roll_no: studentData.roll_no,
    date_of_birth: studentData.date_of_birth 
  });

  try {
    return await studentModel.update(id, studentData);
  } catch (error) {
    // Provide helpful error message if foreign key constraint fails
    if (error.message.includes('foreign key constraint')) {
      throw new Error('Cannot update student ID: Foreign key constraint not configured for CASCADE UPDATE. Please run the database migration script: enable-student-id-cascade-update.sql');
    }
    throw error;
  }
};

/**
 * Delete student
 * @param {number} id - Student ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteStudent = async (id) => {
  const student = await studentModel.findById(id);
  if (!student) {
    throw new Error('Student not found');
  }

  return await studentModel.remove(id);
};

