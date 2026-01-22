import * as studentModel from '../students/student.model.js';
import * as facultyModel from '../faculty/faculty.model.js';
import * as busModel from '../transport/bus.model.js';

/**
 * Report Service - Business logic for report generation
 */

/**
 * Generate student report
 * @param {Object} filters - Filter options (class, section, status)
 * @returns {Promise<Object>} Report data with statistics and student list
 */
export const generateStudentReport = async (filters = {}) => {
  try {
    let students = await studentModel.findAll();

    // Apply filters
    if (filters.class) {
      students = students.filter(s => s.class === filters.class);
    }
    if (filters.section) {
      students = students.filter(s => s.section === filters.section);
    }
    if (filters.status) {
      students = students.filter(s => s.status === filters.status);
    }

    // Calculate statistics
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'Active').length;
    const inactiveStudents = students.filter(s => s.status === 'Inactive').length;
    const graduatedStudents = students.filter(s => s.status === 'Graduated').length;

    // Group by class
    const byClass = {};
    students.forEach(student => {
      if (!byClass[student.class]) {
        byClass[student.class] = [];
      }
      byClass[student.class].push(student);
    });

    // Group by section
    const bySection = {};
    students.forEach(student => {
      const key = `${student.class}-${student.section}`;
      if (!bySection[key]) {
        bySection[key] = [];
      }
      bySection[key].push(student);
    });

    return {
      type: 'student',
      generatedAt: new Date(),
      filters,
      statistics: {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        graduated: graduatedStudents,
        byClass,
        bySection
      },
      data: students
    };
  } catch (error) {
    throw new Error(`Failed to generate student report: ${error.message}`);
  }
};

/**
 * Generate staff/faculty report
 * @param {Object} filters - Filter options (designation, status, class, section)
 * @returns {Promise<Object>} Report data with statistics and faculty list
 */
export const generateStaffReport = async (filters = {}) => {
  try {
    let faculty = await facultyModel.findAll();

    // Apply filters
    if (filters.designation) {
      faculty = faculty.filter(f => f.designation === filters.designation);
    }
    if (filters.status) {
      faculty = faculty.filter(f => f.status === filters.status);
    }
    if (filters.class) {
      faculty = faculty.filter(f => f.class === filters.class);
    }
    if (filters.section) {
      faculty = faculty.filter(f => f.section === filters.section);
    }

    // Calculate statistics
    const totalStaff = faculty.length;
    const activeStaff = faculty.filter(f => f.status === 'Active').length;
    const inactiveStaff = faculty.filter(f => f.status === 'Inactive').length;
    const retiredStaff = faculty.filter(f => f.status === 'Retired').length;

    // Group by designation
    const byDesignation = {};
    faculty.forEach(member => {
      const designation = member.designation || 'Not Specified';
      if (!byDesignation[designation]) {
        byDesignation[designation] = [];
      }
      byDesignation[designation].push(member);
    });

    // Group by class
    const byClass = {};
    faculty.forEach(member => {
      if (member.class) {
        if (!byClass[member.class]) {
          byClass[member.class] = [];
        }
        byClass[member.class].push(member);
      }
    });

    // Calculate average experience
    const experiences = faculty
      .filter(f => f.experience !== null && f.experience !== undefined)
      .map(f => f.experience);
    const avgExperience = experiences.length > 0
      ? (experiences.reduce((a, b) => a + b, 0) / experiences.length).toFixed(2)
      : 0;

    return {
      type: 'staff',
      generatedAt: new Date(),
      filters,
      statistics: {
        total: totalStaff,
        active: activeStaff,
        inactive: inactiveStaff,
        retired: retiredStaff,
        averageExperience: avgExperience,
        byDesignation,
        byClass
      },
      data: faculty
    };
  } catch (error) {
    throw new Error(`Failed to generate staff report: ${error.message}`);
  }
};

/**
 * Generate transport maintenance report
 * @param {Object} filters - Filter options (status, expiring documents)
 * @returns {Promise<Object>} Report data with statistics and bus list
 */
export const generateTransportReport = async (filters = {}) => {
  try {
    let buses = await busModel.findAll();

    // Apply filters
    if (filters.status) {
      buses = buses.filter(b => b.status === filters.status);
    }

    // Calculate statistics
    const totalBuses = buses.length;
    const activeBuses = buses.filter(b => b.status === 'Active').length;
    const inactiveBuses = buses.filter(b => b.status === 'Inactive').length;
    const maintenanceBuses = buses.filter(b => b.status === 'Under Maintenance').length;

    // Document expiration status
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

    const expiringDocuments = {
      insurance: buses.filter(b => {
        if (!b.insurance_expiry) return false;
        const expiry = new Date(b.insurance_expiry);
        return expiry >= now && expiry <= twoMonthsFromNow;
      }),
      fc: buses.filter(b => {
        if (!b.fc_expiry) return false;
        const expiry = new Date(b.fc_expiry);
        return expiry >= now && expiry <= twoMonthsFromNow;
      }),
      permit: buses.filter(b => {
        if (!b.permit_expiry) return false;
        const expiry = new Date(b.permit_expiry);
        return expiry >= now && expiry <= twoMonthsFromNow;
      })
    };

    const expiredDocuments = {
      insurance: buses.filter(b => {
        if (!b.insurance_expiry) return false;
        return new Date(b.insurance_expiry) < now;
      }),
      fc: buses.filter(b => {
        if (!b.fc_expiry) return false;
        return new Date(b.fc_expiry) < now;
      }),
      permit: buses.filter(b => {
        if (!b.permit_expiry) return false;
        return new Date(b.permit_expiry) < now;
      })
    };

    // Total capacity
    const totalCapacity = buses
      .filter(b => b.capacity !== null && b.capacity !== undefined)
      .reduce((sum, b) => sum + b.capacity, 0);

    // Group by route
    const byRoute = {};
    buses.forEach(bus => {
      if (bus.route_name) {
        if (!byRoute[bus.route_name]) {
          byRoute[bus.route_name] = [];
        }
        byRoute[bus.route_name].push(bus);
      }
    });

    // Maintenance alerts
    const maintenanceAlerts = await busModel.findBusesWithExpiringDocuments(2);

    return {
      type: 'transport',
      generatedAt: new Date(),
      filters,
      statistics: {
        total: totalBuses,
        active: activeBuses,
        inactive: inactiveBuses,
        underMaintenance: maintenanceBuses,
        totalCapacity,
        expiringDocuments: {
          insurance: expiringDocuments.insurance.length,
          fc: expiringDocuments.fc.length,
          permit: expiringDocuments.permit.length
        },
        expiredDocuments: {
          insurance: expiredDocuments.insurance.length,
          fc: expiredDocuments.fc.length,
          permit: expiredDocuments.permit.length
        },
        byRoute
      },
      maintenanceAlerts,
      expiringDetails: expiringDocuments,
      expiredDetails: expiredDocuments,
      data: buses
    };
  } catch (error) {
    throw new Error(`Failed to generate transport report: ${error.message}`);
  }
};
