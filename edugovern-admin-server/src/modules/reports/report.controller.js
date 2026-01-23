import { generateStudentReport, generateStaffReport, generateTransportReport } from './report.service.js';

/**
 * Report Controller - HTTP request handlers for report generation
 */

/**
 * Generate student report
 * GET /api/admin/reports/students
 */
export const getStudentReport = async (req, res) => {
  try {
    const filters = {
      class: req.query.class || null,
      section: req.query.section || null,
      status: req.query.status || null
    };

    const report = await generateStudentReport(filters);

    res.status(200).json({
      success: true,
      message: 'Student report generated successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate student report'
    });
  }
};

/**
 * Generate staff report
 * GET /api/admin/reports/staff
 */
export const getStaffReport = async (req, res) => {
  try {
    const filters = {
      designation: req.query.designation || null,
      status: req.query.status || null,
      class: req.query.class || null,
      section: req.query.section || null
    };

    const report = await generateStaffReport(filters);

    res.status(200).json({
      success: true,
      message: 'Staff report generated successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate staff report'
    });
  }
};

/**
 * Generate transport maintenance report
 * GET /api/admin/reports/transport
 */
export const getTransportReport = async (req, res) => {
  try {
    const filters = {
      status: req.query.status || null
    };

    const report = await generateTransportReport(filters);

    // Debug: Log maintenance data in response
    if (report && report.data) {
      console.log('Transport Report - Total buses:', report.data.length);
      report.data.forEach((bus, idx) => {
        if (bus.maintenanceRecords && bus.maintenanceRecords.length > 0) {
          console.log(`Bus ${idx + 1} (${bus.bus_number}): ${bus.maintenanceRecords.length} maintenance records`);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transport report generated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error generating transport report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate transport report'
    });
  }
};
