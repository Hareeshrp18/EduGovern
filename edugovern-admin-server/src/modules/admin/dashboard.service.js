import * as studentModel from '../students/student.model.js';
import * as facultyModel from '../faculty/faculty.model.js';
import * as busModel from '../transport/bus.model.js';
import * as announcementModel from '../announcements/announcement.model.js';
import * as busService from '../transport/bus.service.js';

/**
 * Dashboard Service - Business logic for dashboard statistics
 */

/**
 * Get dashboard statistics
 * @returns {Promise<Object>} Dashboard statistics
 */
export const getDashboardStats = async () => {
  try {
    // Get all counts in parallel
    const [students, faculty, buses, announcements, busesWithAlerts] = await Promise.all([
      studentModel.findAll(),
      facultyModel.findAll(),
      busModel.findAll(),
      announcementModel.findAll(),
      busService.getBusesWithExpiringDocuments(2)
    ]);

    // Count students by status
    const activeStudents = students.filter(s => s.status === 'Active').length;
    const inactiveStudents = students.filter(s => s.status === 'Inactive').length;
    const graduatedStudents = students.filter(s => s.status === 'Graduated').length;

    // Count faculty by status
    const activeFaculty = faculty.filter(f => f.status === 'Active').length;
    const inactiveFaculty = faculty.filter(f => f.status === 'Inactive').length;
    const retiredFaculty = faculty.filter(f => f.status === 'Retired').length;

    // Count buses by status
    const activeBuses = buses.filter(b => b.status === 'Active').length;
    const inactiveBuses = buses.filter(b => b.status === 'Inactive').length;
    const maintenanceBuses = buses.filter(b => b.status === 'Under Maintenance').length;

    // Count announcements by status
    const publishedAnnouncements = announcements.filter(a => a.status === 'Published').length;
    const draftAnnouncements = announcements.filter(a => a.status === 'Draft').length;
    const scheduledAnnouncements = announcements.filter(a => a.status === 'Scheduled').length;

    // Count alerts
    const totalAlerts = busesWithAlerts.reduce((sum, bus) => sum + (bus.alerts?.length || 0), 0);
    const criticalAlerts = busesWithAlerts.flatMap(bus => bus.alerts || []).filter(a => a.severity === 'critical').length;
    const urgentAlerts = busesWithAlerts.flatMap(bus => bus.alerts || []).filter(a => a.severity === 'urgent').length;

    return {
      students: {
        total: students.length,
        active: activeStudents,
        inactive: inactiveStudents,
        graduated: graduatedStudents
      },
      faculty: {
        total: faculty.length,
        active: activeFaculty,
        inactive: inactiveFaculty,
        retired: retiredFaculty
      },
      transport: {
        total: buses.length,
        active: activeBuses,
        inactive: inactiveBuses,
        underMaintenance: maintenanceBuses
      },
      announcements: {
        total: announcements.length,
        published: publishedAnnouncements,
        draft: draftAnnouncements,
        scheduled: scheduledAnnouncements
      },
      alerts: {
        total: totalAlerts,
        critical: criticalAlerts,
        urgent: urgentAlerts,
        busesWithAlerts: busesWithAlerts.length
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch dashboard statistics: ${error.message}`);
  }
};
