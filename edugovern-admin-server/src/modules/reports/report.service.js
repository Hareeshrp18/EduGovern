import * as studentModel from '../students/student.model.js';
import * as facultyModel from '../faculty/faculty.model.js';
import * as busModel from '../transport/bus.model.js';
import * as maintenanceService from '../transport/maintenance.service.js';

/**
 * Report Service - Business logic for report generation
 */

/** Normalize class for comparison so "10th" and "10" match (students/faculty may use either). */
function normalizeClassForCompare(val) {
  if (val == null || val === '') return '';
  const v = String(val).trim();
  if (/^PreKG$/i.test(v)) return 'prekg';
  if (/^LKG$/i.test(v)) return 'lkg';
  if (/^UKG$/i.test(v)) return 'ukg';
  const numMatch = v.match(/^(\d+)/);
  if (numMatch) return numMatch[1];
  return v.toLowerCase();
}

/**
 * Generate student report
 * @param {Object} filters - Filter options (class, section, status)
 * @returns {Promise<Object>} Report data with statistics and student list
 */
export const generateStudentReport = async (filters = {}) => {
  try {
    let students = await studentModel.findAll();

    // Apply filters (class compared normalized so "10th" matches "10")
    if (filters.class) {
      const classNorm = normalizeClassForCompare(filters.class);
      students = students.filter(s => normalizeClassForCompare(s.class) === classNorm);
    }
    if (filters.section) {
      students = students.filter(s => s.section === filters.section);
    }
    if (filters.status) {
      students = students.filter(s => s.status === filters.status);
    }
    
    // Apply date range filter
    if (filters.fromDate || filters.toDate) {
      students = students.filter(s => {
        // Use admission_date if available, otherwise use created_at
        const dateToCheck = s.admission_date || s.created_at;
        if (!dateToCheck) return false;
        
        // Extract date part only (YYYY-MM-DD) to avoid timezone issues
        let recordDateStr;
        if (typeof dateToCheck === 'string') {
          recordDateStr = dateToCheck.split('T')[0].substring(0, 10);
        } else {
          const d = new Date(dateToCheck);
          recordDateStr = d.toISOString().split('T')[0];
        }
        
        // Compare as date strings (YYYY-MM-DD)
        if (filters.fromDate && filters.toDate) {
          const fromDateStr = filters.fromDate.split('T')[0].substring(0, 10);
          const toDateStr = filters.toDate.split('T')[0].substring(0, 10);
          return recordDateStr >= fromDateStr && recordDateStr <= toDateStr;
        } else if (filters.fromDate) {
          const fromDateStr = filters.fromDate.split('T')[0].substring(0, 10);
          return recordDateStr >= fromDateStr;
        } else if (filters.toDate) {
          const toDateStr = filters.toDate.split('T')[0].substring(0, 10);
          return recordDateStr <= toDateStr;
        }
        return true;
      });
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
      const classNorm = normalizeClassForCompare(filters.class);
      faculty = faculty.filter(f => normalizeClassForCompare(f.class) === classNorm);
    }
    if (filters.section) {
      faculty = faculty.filter(f => f.section === filters.section);
    }
    
    // Apply date range filter
    if (filters.fromDate || filters.toDate) {
      faculty = faculty.filter(f => {
        // Use joining_date if available, otherwise use created_at
        const dateToCheck = f.joining_date || f.created_at;
        if (!dateToCheck) return false;
        
        // Extract date part only (YYYY-MM-DD) to avoid timezone issues
        let recordDateStr;
        if (typeof dateToCheck === 'string') {
          recordDateStr = dateToCheck.split('T')[0].substring(0, 10);
        } else {
          const d = new Date(dateToCheck);
          recordDateStr = d.toISOString().split('T')[0];
        }
        
        // Compare as date strings (YYYY-MM-DD)
        if (filters.fromDate && filters.toDate) {
          const fromDateStr = filters.fromDate.split('T')[0].substring(0, 10);
          const toDateStr = filters.toDate.split('T')[0].substring(0, 10);
          return recordDateStr >= fromDateStr && recordDateStr <= toDateStr;
        } else if (filters.fromDate) {
          const fromDateStr = filters.fromDate.split('T')[0].substring(0, 10);
          return recordDateStr >= fromDateStr;
        } else if (filters.toDate) {
          const toDateStr = filters.toDate.split('T')[0].substring(0, 10);
          return recordDateStr <= toDateStr;
        }
        return true;
      });
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
    
    // Apply date range filter for buses (by created_at)
    if (filters.fromDate || filters.toDate) {
      buses = buses.filter(b => {
        const dateToCheck = b.created_at;
        if (!dateToCheck) return false;
        
        // Extract date part only (YYYY-MM-DD) to avoid timezone issues
        let recordDateStr;
        if (typeof dateToCheck === 'string') {
          recordDateStr = dateToCheck.split('T')[0].substring(0, 10);
        } else {
          const d = new Date(dateToCheck);
          recordDateStr = d.toISOString().split('T')[0];
        }
        
        // Compare as date strings (YYYY-MM-DD)
        if (filters.fromDate && filters.toDate) {
          const fromDateStr = filters.fromDate.split('T')[0].substring(0, 10);
          const toDateStr = filters.toDate.split('T')[0].substring(0, 10);
          return recordDateStr >= fromDateStr && recordDateStr <= toDateStr;
        } else if (filters.fromDate) {
          const fromDateStr = filters.fromDate.split('T')[0].substring(0, 10);
          return recordDateStr >= fromDateStr;
        } else if (filters.toDate) {
          const toDateStr = filters.toDate.split('T')[0].substring(0, 10);
          return recordDateStr <= toDateStr;
        }
        return true;
      });
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

    // Fetch maintenance records for each bus
    const busesWithMaintenance = await Promise.all(
      buses.map(async (bus) => {
        try {
          console.log(`[REPORT] Fetching maintenance for bus ID: ${bus.id}, Bus Number: ${bus.bus_number}`);
          
          // Try fetching by bus.id first
          let maintenanceRecords = await maintenanceService.getMaintenanceByBusId(bus.id);
          
          // If no records found, try to find by bus_number as fallback (in case ID mismatch)
          if (!maintenanceRecords || maintenanceRecords.length === 0) {
            console.log(`[REPORT] No records found for bus.id=${bus.id}, checking if bus_id in maintenance table matches...`);
            // We'll keep the original query but log the issue
          }
          
          console.log(`[REPORT] Bus ${bus.id} (${bus.bus_number}): Raw maintenance data:`, {
            type: typeof maintenanceRecords,
            isArray: Array.isArray(maintenanceRecords),
            length: maintenanceRecords ? maintenanceRecords.length : 0,
            records: maintenanceRecords ? maintenanceRecords.slice(0, 2) : null // Show first 2 records for debugging
          });
          
          // Ensure maintenanceRecords is an array
          let records = Array.isArray(maintenanceRecords) ? maintenanceRecords : [];
          
          // Filter maintenance records by date range if provided
          if (filters.fromDate || filters.toDate) {
            records = records.filter(record => {
              const maintenanceDate = record.maintenance_date || record.created_at;
              if (!maintenanceDate) return false;
              
              // Extract date part only (YYYY-MM-DD) to avoid timezone issues
              // Handle both date strings and Date objects
              let recordDateStr;
              if (typeof maintenanceDate === 'string') {
                // If it's a string, extract the date part (YYYY-MM-DD)
                recordDateStr = maintenanceDate.split('T')[0].substring(0, 10);
              } else {
                // If it's a Date object, format it as YYYY-MM-DD
                const d = new Date(maintenanceDate);
                recordDateStr = d.toISOString().split('T')[0];
              }
              
              // Compare as date strings (YYYY-MM-DD) to avoid timezone issues
              if (filters.fromDate && filters.toDate) {
                const fromDateStr = filters.fromDate.split('T')[0].substring(0, 10);
                const toDateStr = filters.toDate.split('T')[0].substring(0, 10);
                return recordDateStr >= fromDateStr && recordDateStr <= toDateStr;
              } else if (filters.fromDate) {
                const fromDateStr = filters.fromDate.split('T')[0].substring(0, 10);
                return recordDateStr >= fromDateStr;
              } else if (filters.toDate) {
                const toDateStr = filters.toDate.split('T')[0].substring(0, 10);
                return recordDateStr <= toDateStr;
              }
              return true;
            });
          }
          
          const totalCost = records.reduce((sum, record) => {
            const cost = parseFloat(record.cost) || 0;
            return sum + cost;
          }, 0);
          
          const busWithMaintenance = {
            ...bus,
            maintenanceRecords: records,
            maintenanceCount: records.length,
            totalMaintenanceCost: totalCost,
            lastMaintenanceDate: records.length > 0
              ? records[0].maintenance_date
              : null,
            nextMaintenanceDate: records.length > 0
              ? (records.find(r => r.next_maintenance_date)?.next_maintenance_date || null)
              : null
          };
          
          console.log(`[REPORT] Bus ${bus.id} final data:`, {
            bus_number: busWithMaintenance.bus_number,
            maintenanceCount: busWithMaintenance.maintenanceCount,
            totalMaintenanceCost: busWithMaintenance.totalMaintenanceCost,
            hasRecords: busWithMaintenance.maintenanceRecords.length > 0
          });
          
          return busWithMaintenance;
        } catch (error) {
          // Log error but continue without maintenance data
          console.error(`[REPORT] Error fetching maintenance for bus ${bus.id} (${bus.bus_number}):`, error.message);
          console.error(`[REPORT] Error stack:`, error.stack);
          return {
            ...bus,
            maintenanceRecords: [],
            maintenanceCount: 0,
            totalMaintenanceCost: 0,
            lastMaintenanceDate: null,
            nextMaintenanceDate: null
          };
        }
      })
    );

    // Calculate maintenance statistics
    const totalMaintenanceRecords = busesWithMaintenance.reduce(
      (sum, bus) => sum + bus.maintenanceCount, 0
    );
    const totalMaintenanceCost = busesWithMaintenance.reduce(
      (sum, bus) => sum + bus.totalMaintenanceCost, 0
    );

    // Sort buses by bus number in ascending order
    busesWithMaintenance.sort((a, b) => {
      const busNumA = a.bus_number || '';
      const busNumB = b.bus_number || '';
      
      // Extract numeric part if exists, otherwise use string comparison
      const numA = parseInt(busNumA.match(/\d+/)?.[0] || '0');
      const numB = parseInt(busNumB.match(/\d+/)?.[0] || '0');
      
      // If both have numbers, compare numerically
      if (numA !== 0 && numB !== 0) {
        return numA - numB;
      }
      
      // Otherwise, compare as strings with numeric awareness
      return busNumA.localeCompare(busNumB, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Debug: Log final report data structure
    console.log(`[REPORT] Final report summary:`, {
      totalBuses: busesWithMaintenance.length,
      totalMaintenanceRecords,
      totalMaintenanceCost,
      busesWithMaintenance: busesWithMaintenance.map(b => ({
        id: b.id,
        bus_number: b.bus_number,
        maintenanceCount: b.maintenanceCount,
        totalMaintenanceCost: b.totalMaintenanceCost,
        recordsCount: b.maintenanceRecords ? b.maintenanceRecords.length : 0
      }))
    });

    const reportData = {
      type: 'transport',
      generatedAt: new Date(),
      filters,
      statistics: {
        total: totalBuses,
        active: activeBuses,
        inactive: inactiveBuses,
        underMaintenance: maintenanceBuses,
        totalCapacity,
        totalMaintenanceRecords,
        totalMaintenanceCost: totalMaintenanceCost.toFixed(2),
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
      data: busesWithMaintenance
    };

    // Verify maintenance records are included in response
    if (reportData.data && reportData.data.length > 0) {
      const firstBus = reportData.data[0];
      console.log(`[REPORT] Sample bus data from report:`, {
        id: firstBus.id,
        bus_number: firstBus.bus_number,
        maintenanceCount: firstBus.maintenanceCount,
        totalMaintenanceCost: firstBus.totalMaintenanceCost,
        maintenanceRecords: firstBus.maintenanceRecords ? firstBus.maintenanceRecords.length : 0,
        hasRecordsProperty: 'maintenanceRecords' in firstBus,
        firstRecord: firstBus.maintenanceRecords && firstBus.maintenanceRecords.length > 0 ? firstBus.maintenanceRecords[0] : null
      });
    }

    return reportData;
  } catch (error) {
    throw new Error(`Failed to generate transport report: ${error.message}`);
  }
};
