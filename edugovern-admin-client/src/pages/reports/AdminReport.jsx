import { useState, useEffect } from 'react';
import './AdminReport.css';
import Sidebar from '../../components/layout/Sidebar';
import {
  generateStudentReport,
  generateStaffReport,
  generateTransportReport
} from '../../services/report.service.js';
import { getBusMaintenance, getAllBuses } from '../../services/transport.service.js';
import { getClasses, getSections } from '../../services/academic.service.js';

const AdminReport = () => {
  const [reportType, setReportType] = useState('student');
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    status: '',
    designation: '',
    fromDate: '',
    toDate: ''
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBusesForMaintenance, setSelectedBusesForMaintenance] = useState(new Set());
  const [busListForMaintenance, setBusListForMaintenance] = useState([]);
  const [loadingBusesForMaintenance, setLoadingBusesForMaintenance] = useState(false);
  const [showBusRecordsFields, setShowBusRecordsFields] = useState(true);
  const [showMaintenanceRecordsFields, setShowMaintenanceRecordsFields] = useState(false);
  const [selectedFields, setSelectedFields] = useState({
    bus_number: true,
    registration_number: true,
    chassis_number: true,
    engine_number: true,
    driver_name: true,
    driver_contact: true,
    route_name: true,
    capacity: true,
    vehicle_weight: true,
    insurance_expiry: true,
    fc_expiry: true,
    permit_expiry: true,
    status: true,
    maintenance: true
  });
  const [selectedMaintenanceFields, setSelectedMaintenanceFields] = useState({
    maintenance_date: true,
    maintenance_type: true,
    description: true,
    cost: true,
    service_provider: true,
    next_maintenance_date: true,
    odometer_reading: true,
    notes: true,
    bus_number: true,
    registration_number: true
  });

  useEffect(() => {
    getClasses().then((data) => setClasses(Array.isArray(data) ? data : [])).catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    if (!filters.class) {
      setSections([]);
      return;
    }
    const classId = classes.find((c) => c.name === filters.class)?.id;
    if (!classId) {
      setSections([]);
      return;
    }
    getSections(classId).then((data) => setSections(Array.isArray(data) ? data : [])).catch(() => setSections([]));
  }, [filters.class, classes]);

  // Load bus list for "Include Maintenance Records"
  useEffect(() => {
    if (reportType !== 'transport' || !showMaintenanceRecordsFields) {
      setBusListForMaintenance([]);
      return;
    }
    let cancelled = false;
    setLoadingBusesForMaintenance(true);
    getAllBuses()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setBusListForMaintenance(data);
        } else if (!cancelled) {
          setBusListForMaintenance([]);
        }
      })
      .catch(() => {
        if (!cancelled) setBusListForMaintenance([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBusesForMaintenance(false);
      });
    return () => { cancelled = true; };
  }, [reportType, showMaintenanceRecordsFields]);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError('');
      setReportData(null);
      // Reset checkboxes to default for transport reports
      if (reportType === 'transport') {
        // No action needed - states are managed separately
      }

      let report;
      const reportFilters = {};

      // Add date range filters if provided
      if (filters.fromDate) reportFilters.fromDate = filters.fromDate;
      if (filters.toDate) reportFilters.toDate = filters.toDate;

      if (reportType === 'student') {
        if (filters.class) reportFilters.class = filters.class;
        if (filters.section) reportFilters.section = filters.section;
        if (filters.status) reportFilters.status = filters.status;
        report = await generateStudentReport(reportFilters);
      } else if (reportType === 'staff') {
        if (filters.designation) reportFilters.designation = filters.designation;
        if (filters.status) reportFilters.status = filters.status;
        if (filters.class) reportFilters.class = filters.class;
        if (filters.section) reportFilters.section = filters.section;
        report = await generateStaffReport(reportFilters);
      } else if (reportType === 'transport') {
        if (filters.status) reportFilters.status = filters.status;
        report = await generateTransportReport(reportFilters);

        // Initialize selected buses: preserve user's pre-selection from bus list, or default to all buses with maintenance
        let selectedBusIds = new Set();
        if (report && report.data) {
          const busesWithMaintenance = report.data
            .filter(bus => bus.maintenanceRecords && bus.maintenanceRecords.length > 0)
            .map(bus => bus.id);
          const hadPreSelection = selectedBusesForMaintenance.size > 0;
          const reportBusIds = new Set(report.data.map(b => b.id));
          if (hadPreSelection) {
            // Keep only pre-selected IDs that exist in the report
            selectedBusIds = new Set([...selectedBusesForMaintenance].filter(id => reportBusIds.has(id)));
          } else {
            selectedBusIds = new Set(busesWithMaintenance);
          }
          setSelectedBusesForMaintenance(selectedBusIds);
        } else {
          setSelectedBusesForMaintenance(new Set());
        }

        // Recalculate maintenance statistics to include only selected buses (so report reflects checkbox selection)
        if (report && report.data && report.statistics) {
          const totalMaintenanceRecords = report.data.reduce(
            (sum, bus) => sum + (selectedBusIds.has(bus.id) ? (bus.maintenanceCount || 0) : 0),
            0
          );
          const totalMaintenanceCost = report.data.reduce(
            (sum, bus) => sum + (selectedBusIds.has(bus.id) ? (parseFloat(bus.totalMaintenanceCost) || 0) : 0),
            0
          );
          report = {
            ...report,
            statistics: {
              ...report.statistics,
              totalMaintenanceRecords,
              totalMaintenanceCost: totalMaintenanceCost.toFixed(2)
            }
          };
        }
      } else {
        // Reset selection when switching report types
        setSelectedBusesForMaintenance(new Set());
      }

      setReportData(report);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;

    if (reportType === 'transport') {
      // Generate PDFs - always generate both bus records and maintenance records
      let printCount = 0;
      
      // 1. Bus Records PDF
      const busDataToExport = {
        ...reportData,
        data: reportData.data.map(bus => ({
          ...bus,
          maintenanceRecords: [],
          maintenanceCount: 0,
          totalMaintenanceCost: 0
        }))
      };
      const busHTMLContent = generateBusRecordsHTML(busDataToExport);
      const busPrintWindow = window.open('', '_blank');
      busPrintWindow.document.write(busHTMLContent);
      busPrintWindow.document.close();
      busPrintWindow.print();
      printCount++;

      // 2. Maintenance Records PDF (for selected buses)
      const maintenanceData = reportData.data
        .filter(bus => selectedBusesForMaintenance.has(bus.id) && bus.maintenanceRecords && bus.maintenanceRecords.length > 0)
        .flatMap(bus => 
          bus.maintenanceRecords.map(record => ({
            ...record,
            bus_number: bus.bus_number,
            registration_number: bus.registration_number
          }))
        );

      if (maintenanceData.length > 0) {
        // Small delay to allow previous print dialog to appear
        setTimeout(() => {
          const maintenanceHTMLContent = generateMaintenanceRecordsHTML(maintenanceData, reportData);
          const maintenancePrintWindow = window.open('', '_blank');
          maintenancePrintWindow.document.write(maintenanceHTMLContent);
          maintenancePrintWindow.document.close();
          maintenancePrintWindow.print();
        }, printCount > 0 ? 500 : 0);
      }
    } else {
      // For student and staff reports, use the original function
      const printWindow = window.open('', '_blank');
      const htmlContent = generateHTMLReport(reportData, reportType);
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleMaintenanceToggle = async (selectedSet, busId = null, isChecked = false) => {
    if (reportType !== 'transport' || !reportData || !reportData.data) return;

    // If a specific bus was toggled, fetch or remove its maintenance
    if (busId !== null) {
      const updatedData = reportData.data.map(bus => {
        if (bus.id === busId) {
          if (isChecked) {
            // Fetch maintenance records for this bus
            return fetchBusMaintenance(bus);
          } else {
            // Remove maintenance records
            return {
              ...bus,
              maintenanceRecords: [],
              maintenanceCount: 0,
              totalMaintenanceCost: 0,
              lastMaintenanceDate: null,
              nextMaintenanceDate: null
            };
          }
        }
        return bus;
      });

      // Update report data
      let sortedData = await Promise.all(updatedData);
      
      // Sort by bus number in ascending order
      sortedData.sort((a, b) => {
        const busNumA = a.bus_number || '';
        const busNumB = b.bus_number || '';
        const numA = parseInt(busNumA.match(/\d+/)?.[0] || '0');
        const numB = parseInt(busNumB.match(/\d+/)?.[0] || '0');
        if (numA !== 0 && numB !== 0) {
          return numA - numB;
        }
        return busNumA.localeCompare(busNumB, undefined, { numeric: true, sensitivity: 'base' });
      });

      const updatedReport = {
        ...reportData,
        data: sortedData
      };

      // Recalculate statistics
      const totalMaintenanceRecords = updatedReport.data.reduce(
        (sum, bus) => sum + (selectedSet.has(bus.id) ? bus.maintenanceCount : 0), 0
      );
      const totalMaintenanceCost = updatedReport.data.reduce(
        (sum, bus) => sum + (selectedSet.has(bus.id) ? bus.totalMaintenanceCost : 0), 0
      );

      updatedReport.statistics = {
        ...updatedReport.statistics,
        totalMaintenanceRecords,
        totalMaintenanceCost: totalMaintenanceCost.toFixed(2)
      };

      setReportData(updatedReport);
    } else {
      // Select All or Deselect All - update all buses at once
      let updatedData = await Promise.all(
        reportData.data.map(async (bus) => {
          if (selectedSet.has(bus.id)) {
            // Fetch maintenance if not already loaded
            if (!bus.maintenanceRecords || bus.maintenanceRecords.length === 0) {
              return await fetchBusMaintenance(bus);
            }
            return bus;
          } else {
            // Remove maintenance
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

      // Sort by bus number in ascending order
      updatedData.sort((a, b) => {
        const busNumA = a.bus_number || '';
        const busNumB = b.bus_number || '';
        const numA = parseInt(busNumA.match(/\d+/)?.[0] || '0');
        const numB = parseInt(busNumB.match(/\d+/)?.[0] || '0');
        if (numA !== 0 && numB !== 0) {
          return numA - numB;
        }
        return busNumA.localeCompare(busNumB, undefined, { numeric: true, sensitivity: 'base' });
      });

      // Recalculate statistics
      const totalMaintenanceRecords = updatedData.reduce(
        (sum, bus) => sum + (selectedSet.has(bus.id) ? bus.maintenanceCount : 0), 0
      );
      const totalMaintenanceCost = updatedData.reduce(
        (sum, bus) => sum + (selectedSet.has(bus.id) ? bus.totalMaintenanceCost : 0), 0
      );

      const updatedReport = {
        ...reportData,
        data: updatedData,
        statistics: {
          ...reportData.statistics,
          totalMaintenanceRecords,
          totalMaintenanceCost: totalMaintenanceCost.toFixed(2)
        }
      };

      setReportData(updatedReport);
    }
  };

  const fetchBusMaintenance = async (bus) => {
    try {
      const maintenanceRecords = await getBusMaintenance(bus.id);
      const records = Array.isArray(maintenanceRecords) ? maintenanceRecords : [];
      const totalCost = records.reduce((sum, record) => {
        const cost = parseFloat(record.cost) || 0;
        return sum + cost;
      }, 0);

      return {
        ...bus,
        maintenanceRecords: records,
        maintenanceCount: records.length,
        totalMaintenanceCost: totalCost,
        lastMaintenanceDate: records.length > 0 ? records[0].maintenance_date : null,
        nextMaintenanceDate: records.length > 0
          ? (records.find(r => r.next_maintenance_date)?.next_maintenance_date || null)
          : null
      };
    } catch (error) {
      console.error(`Error fetching maintenance for bus ${bus.id}:`, error);
      return {
        ...bus,
        maintenanceRecords: [],
        maintenanceCount: 0,
        totalMaintenanceCost: 0,
        lastMaintenanceDate: null,
        nextMaintenanceDate: null
      };
    }
  };

  const handleDownloadCSV = () => {
    if (!reportData) return;

    if (reportType === 'transport') {
      // Generate two separate CSV files for transport reports
      // 1. Bus Records CSV
      const busCSV = generateBusRecordsCSV(reportData.data);
      const busBlob = new Blob([busCSV], { type: 'text/csv' });
      const busUrl = window.URL.createObjectURL(busBlob);
      const busLink = document.createElement('a');
      busLink.href = busUrl;
      busLink.download = `transport_bus_records_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(busLink);
      busLink.click();
      document.body.removeChild(busLink);
      window.URL.revokeObjectURL(busUrl);

      // 2. Maintenance Records CSV (only for selected buses)
      const maintenanceData = reportData.data
        .filter(bus => selectedBusesForMaintenance.has(bus.id) && bus.maintenanceRecords && bus.maintenanceRecords.length > 0)
        .flatMap(bus => 
          bus.maintenanceRecords.map(record => ({
            ...record,
            bus_number: bus.bus_number,
            registration_number: bus.registration_number
          }))
        );

      if (maintenanceData.length > 0) {
        setTimeout(() => {
          const maintenanceCSV = generateMaintenanceRecordsCSV(maintenanceData);
          const maintenanceBlob = new Blob([maintenanceCSV], { type: 'text/csv' });
          const maintenanceUrl = window.URL.createObjectURL(maintenanceBlob);
          const maintenanceLink = document.createElement('a');
          maintenanceLink.href = maintenanceUrl;
          maintenanceLink.download = `transport_maintenance_records_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(maintenanceLink);
          maintenanceLink.click();
          document.body.removeChild(maintenanceLink);
          window.URL.revokeObjectURL(maintenanceUrl);
        }, 300);
      }
    } else {
      // For student and staff reports, use the original function
      let csv = '';
      if (reportType === 'student') {
        csv = generateStudentCSV(reportData.data);
      } else if (reportType === 'staff') {
        csv = generateStaffCSV(reportData.data);
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const generateHTMLReport = (data, type) => {
    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${type.toUpperCase()} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          h2 { color: #667eea; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #667eea; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .stats { margin: 20px 0; padding: 15px; background-color: #f9f9f9; }
          .stat-item { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>${type.toUpperCase()} Report</h1>
        <p>Generated on: ${new Date(data.generatedAt).toLocaleString()}</p>
    `;

    if (data.statistics) {
      content += '<div class="stats"><h2>Statistics</h2>';
      Object.entries(data.statistics).forEach(([key, value]) => {
        if (typeof value === 'object' && !Array.isArray(value)) return;
        if (key !== 'byClass' && key !== 'bySection' && key !== 'byDesignation' && key !== 'byRoute') {
          content += `<div class="stat-item"><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</div>`;
        }
      });
      content += '</div>';
    }

    if (data.data && data.data.length > 0) {
      content += '<h2>Details</h2><table>';
      
      if (type === 'student') {
        content += '<tr><th>Student ID</th><th>Name</th><th>Class</th><th>Section</th><th>Contact</th><th>Status</th></tr>';
        data.data.forEach(item => {
          content += `<tr>
            <td>${item.student_id || ''}</td>
            <td>${item.name || ''}</td>
            <td>${item.class || ''}</td>
            <td>${item.section || ''}</td>
            <td>${item.phone || ''}</td>
            <td>${item.status || ''}</td>
          </tr>`;
        });
      } else if (type === 'staff') {
        content += '<tr><th>Name</th><th>Designation</th><th>Email</th><th>Contact</th><th>Experience</th><th>Status</th></tr>';
        data.data.forEach(item => {
          content += `<tr>
            <td>${item.staff_name || item.name || ''}</td>
            <td>${item.designation || ''}</td>
            <td>${item.email || ''}</td>
            <td>${item.contact || ''}</td>
            <td>${item.experience || 0} years</td>
            <td>${item.status || ''}</td>
          </tr>`;
        });
      } else if (type === 'transport') {
        content += '<tr><th>Bus Number</th><th>Registration</th><th>Driver</th><th>Driver Contact</th><th>Route</th><th>Capacity</th><th>Insurance Expiry</th><th>FC Expiry</th><th>Permit Expiry</th><th>Status</th><th>Maintenance Count</th><th>Total Cost</th></tr>';
        data.data.forEach(item => {
          content += `<tr>
            <td>${item.bus_number || ''}</td>
            <td>${item.registration_number || ''}</td>
            <td>${item.driver_name || ''}</td>
            <td>${item.driver_contact || ''}</td>
            <td>${item.route_name || ''}</td>
            <td>${item.capacity || ''}</td>
            <td>${item.insurance_expiry || 'N/A'}</td>
            <td>${item.fc_expiry || 'N/A'}</td>
            <td>${item.permit_expiry || 'N/A'}</td>
            <td>${item.status || ''}</td>
            <td>${item.maintenanceCount || 0}</td>
            <td>₹${parseFloat(item.totalMaintenanceCost || 0).toFixed(2)}</td>
          </tr>`;
        });
        
        // Add maintenance records section
        content += '</table><h2>Maintenance Records</h2><table>';
        content += '<tr><th>Bus Number</th><th>Date</th><th>Type</th><th>Description</th><th>Cost</th><th>Service Provider</th><th>Next Maintenance</th><th>Odometer</th><th>Notes</th></tr>';
        data.data.forEach(item => {
          if (item.maintenanceRecords && item.maintenanceRecords.length > 0) {
            item.maintenanceRecords.forEach(record => {
              content += `<tr>
                <td>${item.bus_number || ''}</td>
                <td>${record.maintenance_date || ''}</td>
                <td>${record.maintenance_type || ''}</td>
                <td>${record.description || ''}</td>
                <td>₹${parseFloat(record.cost || 0).toFixed(2)}</td>
                <td>${record.service_provider || ''}</td>
                <td>${record.next_maintenance_date || 'N/A'}</td>
                <td>${record.odometer_reading || 'N/A'}</td>
                <td>${record.notes || ''}</td>
              </tr>`;
            });
          }
        });
      }
      
      content += '</table>';
    }

    content += '</body></html>';
    return content;
  };

  const generateStudentCSV = (data) => {
    let csv = 'Student ID,Name,Class,Section,Contact,Email,Status\n';
    data.forEach(item => {
      csv += `${item.student_id || ''},${item.name || ''},${item.class || ''},${item.section || ''},${item.phone || ''},${item.email || ''},${item.status || ''}\n`;
    });
    return csv;
  };

  const generateStaffCSV = (data) => {
    let csv = 'Name,Designation,Email,Contact,Experience,Status\n';
    data.forEach(item => {
      csv += `${item.staff_name || item.name || ''},${item.designation || ''},${item.email || ''},${item.contact || ''},${item.experience || 0},${item.status || ''}\n`;
    });
    return csv;
  };

  const generateTransportCSV = (data) => {
    let csv = 'Bus Number,Registration Number,Driver Name,Driver Contact,Route,Capacity,Insurance Expiry,FC Expiry,Permit Expiry,Status,Maintenance Count,Total Maintenance Cost,Last Maintenance Date,Next Maintenance Date\n';
    data.forEach(item => {
      csv += `${item.bus_number || ''},${item.registration_number || ''},${item.driver_name || ''},${item.driver_contact || ''},${item.route_name || ''},${item.capacity || ''},${item.insurance_expiry || ''},${item.fc_expiry || ''},${item.permit_expiry || ''},${item.status || ''},${item.maintenanceCount || 0},${item.totalMaintenanceCost || 0},${item.lastMaintenanceDate || ''},${item.nextMaintenanceDate || ''}\n`;
      
      // Add maintenance records for this bus
      if (item.maintenanceRecords && item.maintenanceRecords.length > 0) {
        csv += '\nMaintenance Records for ' + (item.bus_number || '') + ':\n';
        csv += 'Date,Type,Description,Cost,Service Provider,Next Maintenance Date,Odometer Reading,Notes\n';
        item.maintenanceRecords.forEach(record => {
          csv += `${record.maintenance_date || ''},${record.maintenance_type || ''},${(record.description || '').replace(/,/g, ';')},${record.cost || ''},${record.service_provider || ''},${record.next_maintenance_date || ''},${record.odometer_reading || ''},${(record.notes || '').replace(/,/g, ';')}\n`;
        });
        csv += '\n';
      }
    });
    return csv;
  };

  // Generate HTML for bus records only (without maintenance)
  const generateBusRecordsHTML = (data) => {
    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transport Bus Records Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          h2 { color: #667eea; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #667eea; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .stats { margin: 20px 0; padding: 15px; background-color: #f9f9f9; }
          .stat-item { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>Transport Bus Records Report</h1>
        <p>Generated on: ${new Date(data.generatedAt).toLocaleString()}</p>
    `;

    if (data.statistics) {
      content += '<div class="stats"><h2>Statistics</h2>';
      content += `<div class="stat-item"><strong>Total:</strong> ${data.statistics.total || 0}</div>`;
      content += `<div class="stat-item"><strong>Active:</strong> ${data.statistics.active || 0}</div>`;
      content += `<div class="stat-item"><strong>Inactive:</strong> ${data.statistics.inactive || 0}</div>`;
      content += `<div class="stat-item"><strong>Under Maintenance:</strong> ${data.statistics.underMaintenance || 0}</div>`;
      content += `<div class="stat-item"><strong>Total Capacity:</strong> ${data.statistics.totalCapacity || 0}</div>`;
      content += '</div>';
    }

    if (data.data && data.data.length > 0) {
      content += '<h2>Bus Details</h2><table>';
      
      // Build header row based on selected fields
      let headerRow = '<tr>';
      if (selectedFields.bus_number) headerRow += '<th>Bus Number</th>';
      if (selectedFields.registration_number) headerRow += '<th>Registration</th>';
      if (selectedFields.chassis_number) headerRow += '<th>Chassis Number</th>';
      if (selectedFields.engine_number) headerRow += '<th>Engine Number</th>';
      if (selectedFields.driver_name) headerRow += '<th>Driver</th>';
      if (selectedFields.driver_contact) headerRow += '<th>Driver Contact</th>';
      if (selectedFields.route_name) headerRow += '<th>Route</th>';
      if (selectedFields.capacity) headerRow += '<th>Capacity</th>';
      if (selectedFields.vehicle_weight) headerRow += '<th>Vehicle Weight</th>';
      if (selectedFields.insurance_expiry) headerRow += '<th>Insurance Expiry</th>';
      if (selectedFields.fc_expiry) headerRow += '<th>FC Expiry</th>';
      if (selectedFields.permit_expiry) headerRow += '<th>Permit Expiry</th>';
      if (selectedFields.status) headerRow += '<th>Status</th>';
      headerRow += '</tr>';
      content += headerRow;
      
      // Build data rows based on selected fields
      data.data.forEach(item => {
        const insuranceExpiry = item.insurance_expiry ? new Date(item.insurance_expiry).toLocaleDateString() : 'N/A';
        const fcExpiry = item.fc_expiry ? new Date(item.fc_expiry).toLocaleDateString() : 'N/A';
        const permitExpiry = item.permit_expiry ? new Date(item.permit_expiry).toLocaleDateString() : 'N/A';
        let row = '<tr>';
        if (selectedFields.bus_number) row += `<td>${item.bus_number || ''}</td>`;
        if (selectedFields.registration_number) row += `<td>${item.registration_number || ''}</td>`;
        if (selectedFields.chassis_number) row += `<td>${item.chassis_number || ''}</td>`;
        if (selectedFields.engine_number) row += `<td>${item.engine_number || ''}</td>`;
        if (selectedFields.driver_name) row += `<td>${item.driver_name || ''}</td>`;
        if (selectedFields.driver_contact) row += `<td>${item.driver_contact || ''}</td>`;
        if (selectedFields.route_name) row += `<td>${item.route_name || ''}</td>`;
        if (selectedFields.capacity) row += `<td>${item.capacity || ''}</td>`;
        if (selectedFields.vehicle_weight) row += `<td>${item.vehicle_weight ? `${item.vehicle_weight} kg` : ''}</td>`;
        if (selectedFields.insurance_expiry) row += `<td>${insuranceExpiry}</td>`;
        if (selectedFields.fc_expiry) row += `<td>${fcExpiry}</td>`;
        if (selectedFields.permit_expiry) row += `<td>${permitExpiry}</td>`;
        if (selectedFields.status) row += `<td>${item.status || ''}</td>`;
        row += '</tr>';
        content += row;
      });
      content += '</table>';
    }

    content += '</body></html>';
    return content;
  };

  // Generate HTML for maintenance records only
  const generateMaintenanceRecordsHTML = (maintenanceData, reportData) => {
    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transport Maintenance Records Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          h2 { color: #667eea; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #667eea; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .stats { margin: 20px 0; padding: 15px; background-color: #f9f9f9; }
          .stat-item { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>Transport Maintenance Records Report</h1>
        <p>Generated on: ${new Date(reportData.generatedAt).toLocaleString()}</p>
    `;

    // Calculate maintenance statistics
    const totalRecords = maintenanceData.length;
    const totalCost = maintenanceData.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0);

    content += '<div class="stats"><h2>Statistics</h2>';
    content += `<div class="stat-item"><strong>Total Maintenance Records:</strong> ${totalRecords}</div>`;
    content += `<div class="stat-item"><strong>Total Maintenance Cost:</strong> ₹${totalCost.toFixed(2)}</div>`;
    content += '</div>';

    if (maintenanceData.length > 0) {
      content += '<h2>Maintenance Records</h2><table>';
      content += '<tr><th>Bus Number</th><th>Registration</th><th>Date</th><th>Type</th><th>Description</th><th>Cost</th><th>Service Provider</th><th>Next Maintenance</th><th>Odometer</th><th>Notes</th></tr>';
      maintenanceData.forEach(record => {
        const maintenanceDate = record.maintenance_date ? new Date(record.maintenance_date).toLocaleDateString() : '';
        const nextMaintenanceDate = record.next_maintenance_date ? new Date(record.next_maintenance_date).toLocaleDateString() : 'N/A';
        content += `<tr>
          <td>${record.bus_number || ''}</td>
          <td>${record.registration_number || ''}</td>
          <td>${maintenanceDate}</td>
          <td>${record.maintenance_type || ''}</td>
          <td>${record.description || ''}</td>
          <td>₹${parseFloat(record.cost || 0).toFixed(2)}</td>
          <td>${record.service_provider || ''}</td>
          <td>${nextMaintenanceDate}</td>
          <td>${record.odometer_reading || 'N/A'}</td>
          <td>${record.notes || ''}</td>
        </tr>`;
      });
      content += '</table>';
    } else {
      content += '<p>No maintenance records found.</p>';
    }

    content += '</body></html>';
    return content;
  };

  // Generate CSV for bus records only
  const generateBusRecordsCSV = (data) => {
    let csv = 'Bus Number,Registration Number,Driver Name,Driver Contact,Route,Capacity,Insurance Expiry,FC Expiry,Permit Expiry,Status\n';
    data.forEach(item => {
      const insuranceExpiry = item.insurance_expiry ? new Date(item.insurance_expiry).toLocaleDateString() : '';
      const fcExpiry = item.fc_expiry ? new Date(item.fc_expiry).toLocaleDateString() : '';
      const permitExpiry = item.permit_expiry ? new Date(item.permit_expiry).toLocaleDateString() : '';
      csv += `${item.bus_number || ''},${item.registration_number || ''},${item.driver_name || ''},${item.driver_contact || ''},${item.route_name || ''},${item.capacity || ''},${insuranceExpiry},${fcExpiry},${permitExpiry},${item.status || ''}\n`;
    });
    return csv;
  };

  // Generate CSV for maintenance records only
  const generateMaintenanceRecordsCSV = (maintenanceData) => {
    let csv = 'Bus Number,Registration Number,Date,Type,Description,Cost,Service Provider,Next Maintenance Date,Odometer Reading,Notes\n';
    maintenanceData.forEach(record => {
      const maintenanceDate = record.maintenance_date ? new Date(record.maintenance_date).toLocaleDateString() : '';
      const nextMaintenanceDate = record.next_maintenance_date ? new Date(record.next_maintenance_date).toLocaleDateString() : '';
      csv += `${record.bus_number || ''},${record.registration_number || ''},${maintenanceDate},${record.maintenance_type || ''},${(record.description || '').replace(/,/g, ';')},${record.cost || ''},${record.service_provider || ''},${nextMaintenanceDate},${record.odometer_reading || ''},${(record.notes || '').replace(/,/g, ';')}\n`;
    });
    return csv;
  };

  return (
      <div className='reports-container'>
      <Sidebar />
          <div className='reports-page'>
        <header className="reports-header">
          <h1>Report Generation</h1>
        </header>

        <div className="reports-content">
          {/* Report Type Selection */}
          <div className="report-type-selector">
            <h2>Select Report Type</h2>
            <div className="type-buttons">
              <button
                className={`type-btn ${reportType === 'student' ? 'active' : ''}`}
                onClick={() => {
                  setReportType('student');
                  setReportData(null);
                  setFilters({ class: '', section: '', status: '', designation: '', fromDate: '', toDate: '' });
                }}
              >
                Student Report
              </button>
              <button
                className={`type-btn ${reportType === 'staff' ? 'active' : ''}`}
                onClick={() => {
                  setReportType('staff');
                  setReportData(null);
                  setFilters({ class: '', section: '', status: '', designation: '', fromDate: '', toDate: '' });
                }}
              >
                Staff Report
              </button>
              <button
                className={`type-btn ${reportType === 'transport' ? 'active' : ''}`}
                onClick={() => {
                  setReportType('transport');
                  setReportData(null);
                  setFilters({ class: '', section: '', status: '', designation: '', fromDate: '', toDate: '' });
                  setSelectedBusesForMaintenance(new Set());
                  setShowBusRecordsFields(true);
                  setShowMaintenanceRecordsFields(false);
                }}
              >
                Transport Report
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="report-filters">
            <h2>Filters</h2>
            <div className="filters-grid">
              {reportType === 'student' && (
                <>
                  <div className="filter-group">
                    <label>Class</label>
                    <select
                      value={filters.class}
                      onChange={(e) => setFilters({ ...filters, class: e.target.value, section: '' })}
                    >
                      <option value="">All Classes</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Section</label>
                    <select
                      value={filters.section}
                      onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                    >
                      <option value="">All Sections</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {reportType === 'staff' && (
                <div className="filter-group">
                  <label>Designation</label>
                  <select
                    value={filters.designation}
                    onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
                  >
                    <option value="">All Designations</option>
                    <option value="Principal">Principal</option>
                    <option value="Vice Principal">Vice Principal</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Class Teacher">Class Teacher</option>
                    <option value="Admin Staff">Admin Staff</option>
                    <option value="Librarian">Librarian</option>
                  </select>
                </div>
              )}

              {(reportType === 'student' || reportType === 'staff') && (
                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All Status</option>
                    {reportType === 'student' ? (
                      <>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Graduated">Graduated</option>
                      </>
                    ) : (
                      <>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Retired">Retired</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {reportType === 'transport' && (
                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              )}

              {/* Date Range Filters - Available for all report types */}
              <div className="filter-group date-range-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  className="date-input"
                />
              </div>
              <div className="filter-group date-range-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="date-input"
                  min={filters.fromDate || undefined}
                />
              </div>
            </div>

            {/* Record Type Selection for Transport Reports */}
            {reportType === 'transport' && (
              <div className="record-type-selection">
                <h3>Select Report Type</h3>
                <div className="record-type-checkboxes">
                  <label className="record-type-checkbox-item">
                    <input
                      type="checkbox"
                      checked={showBusRecordsFields}
                      onChange={(e) => {
                        setShowBusRecordsFields(e.target.checked);
                        setIncludeBusRecords(e.target.checked);
                      }}
                    />
                    <span>Bus Records</span>
                  </label>
                  <label className="record-type-checkbox-item">
                    <input
                      type="checkbox"
                      checked={showMaintenanceRecordsFields}
                      onChange={(e) => {
                        setShowMaintenanceRecordsFields(e.target.checked);
                        setIncludeMaintenanceRecords(e.target.checked);
                      }}
                    />
                    <span>Maintenance Records</span>
                  </label>
                </div>
              </div>
            )}

            {/* Field Selection Checkboxes for Bus Records */}
            {reportType === 'transport' && showBusRecordsFields && (
              <div className="field-selection-section">
                <h3>Select Fields to Include in Bus Report</h3>
                <div className="field-checkboxes-grid">
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.bus_number}
                      onChange={(e) => setSelectedFields({ ...selectedFields, bus_number: e.target.checked })}
                    />
                    <span>Bus Number</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.registration_number}
                      onChange={(e) => setSelectedFields({ ...selectedFields, registration_number: e.target.checked })}
                    />
                    <span>Registration Number</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.chassis_number}
                      onChange={(e) => setSelectedFields({ ...selectedFields, chassis_number: e.target.checked })}
                    />
                    <span>Chassis Number</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.engine_number}
                      onChange={(e) => setSelectedFields({ ...selectedFields, engine_number: e.target.checked })}
                    />
                    <span>Engine Number</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.driver_name}
                      onChange={(e) => setSelectedFields({ ...selectedFields, driver_name: e.target.checked })}
                    />
                    <span>Driver Name</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.driver_contact}
                      onChange={(e) => setSelectedFields({ ...selectedFields, driver_contact: e.target.checked })}
                    />
                    <span>Driver Contact</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.route_name}
                      onChange={(e) => setSelectedFields({ ...selectedFields, route_name: e.target.checked })}
                    />
                    <span>Route</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.capacity}
                      onChange={(e) => setSelectedFields({ ...selectedFields, capacity: e.target.checked })}
                    />
                    <span>Capacity</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.vehicle_weight}
                      onChange={(e) => setSelectedFields({ ...selectedFields, vehicle_weight: e.target.checked })}
                    />
                    <span>Vehicle Weight</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.insurance_expiry}
                      onChange={(e) => setSelectedFields({ ...selectedFields, insurance_expiry: e.target.checked })}
                    />
                    <span>Insurance Expiry</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.fc_expiry}
                      onChange={(e) => setSelectedFields({ ...selectedFields, fc_expiry: e.target.checked })}
                    />
                    <span>FC Expiry</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.permit_expiry}
                      onChange={(e) => setSelectedFields({ ...selectedFields, permit_expiry: e.target.checked })}
                    />
                    <span>Permit Expiry</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.status}
                      onChange={(e) => setSelectedFields({ ...selectedFields, status: e.target.checked })}
                    />
                    <span>Status</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.maintenance}
                      onChange={(e) => setSelectedFields({ ...selectedFields, maintenance: e.target.checked })}
                    />
                    <span>Maintenance</span>
                  </label>
                </div>
                <div className="field-selection-actions">
                  <button
                    type="button"
                    className="select-all-fields-btn"
                    onClick={() => setSelectedFields({
                      bus_number: true,
                      registration_number: true,
                      chassis_number: true,
                      engine_number: true,
                      driver_name: true,
                      driver_contact: true,
                      route_name: true,
                      capacity: true,
                      vehicle_weight: true,
                      insurance_expiry: true,
                      fc_expiry: true,
                      permit_expiry: true,
                      status: true,
                      maintenance: true
                    })}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="deselect-all-fields-btn"
                    onClick={() => setSelectedFields({
                      bus_number: false,
                      registration_number: false,
                      chassis_number: false,
                      engine_number: false,
                      driver_name: false,
                      driver_contact: false,
                      route_name: false,
                      capacity: false,
                      vehicle_weight: false,
                      insurance_expiry: false,
                      fc_expiry: false,
                      permit_expiry: false,
                      status: false,
                      maintenance: false
                    })}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            )}

            {/* Field Selection Checkboxes for Maintenance Records */}
            {reportType === 'transport' && showMaintenanceRecordsFields && (
              <div className="field-selection-section">
                <h3>Select Fields to Include in Maintenance Report</h3>
                <div className="field-checkboxes-grid">
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedMaintenanceFields.maintenance_date}
                      onChange={(e) => setSelectedMaintenanceFields({ ...selectedMaintenanceFields, maintenance_date: e.target.checked })}
                    />
                    <span>Maintenance Date</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedMaintenanceFields.maintenance_type}
                      onChange={(e) => setSelectedMaintenanceFields({ ...selectedMaintenanceFields, maintenance_type: e.target.checked })}
                    />
                    <span>Maintenance Type</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedMaintenanceFields.description}
                      onChange={(e) => setSelectedMaintenanceFields({ ...selectedMaintenanceFields, description: e.target.checked })}
                    />
                    <span>Description</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedMaintenanceFields.cost}
                      onChange={(e) => setSelectedMaintenanceFields({ ...selectedMaintenanceFields, cost: e.target.checked })}
                    />
                    <span>Cost</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedMaintenanceFields.service_provider}
                      onChange={(e) => setSelectedMaintenanceFields({ ...selectedMaintenanceFields, service_provider: e.target.checked })}
                    />
                    <span>Service Provider</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedMaintenanceFields.next_maintenance_date}
                      onChange={(e) => setSelectedMaintenanceFields({ ...selectedMaintenanceFields, next_maintenance_date: e.target.checked })}
                    />
                    <span>Next Maintenance Date</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedMaintenanceFields.odometer_reading}
                      onChange={(e) => setSelectedMaintenanceFields({ ...selectedMaintenanceFields, odometer_reading: e.target.checked })}
                    />
                    <span>Odometer Reading</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedMaintenanceFields.notes}
                      onChange={(e) => setSelectedMaintenanceFields({ ...selectedMaintenanceFields, notes: e.target.checked })}
                    />
                    <span>Notes</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedMaintenanceFields.bus_number}
                      onChange={(e) => setSelectedMaintenanceFields({ ...selectedMaintenanceFields, bus_number: e.target.checked })}
                    />
                    <span>Bus Number</span>
                  </label>
                  <label className="field-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedMaintenanceFields.registration_number}
                      onChange={(e) => setSelectedMaintenanceFields({ ...selectedMaintenanceFields, registration_number: e.target.checked })}
                    />
                    <span>Registration Number</span>
                  </label>
                </div>
                <div className="field-selection-actions">
                  <button
                    type="button"
                    className="select-all-fields-btn"
                    onClick={() => setSelectedMaintenanceFields({
                      maintenance_date: true,
                      maintenance_type: true,
                      description: true,
                      cost: true,
                      service_provider: true,
                      next_maintenance_date: true,
                      odometer_reading: true,
                      notes: true,
                      bus_number: true,
                      registration_number: true
                    })}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="deselect-all-fields-btn"
                    onClick={() => setSelectedMaintenanceFields({
                      maintenance_date: false,
                      maintenance_type: false,
                      description: false,
                      cost: false,
                      service_provider: false,
                      next_maintenance_date: false,
                      odometer_reading: false,
                      notes: false,
                      bus_number: false,
                      registration_number: false
                    })}
                  >
                    Deselect All
                  </button>
          </div>
      </div>
            )}

            {/* Transport Maintenance Selection - Show below field selection when Maintenance Records is selected */}
            {reportType === 'transport' && showMaintenanceRecordsFields && (
              <div className="maintenance-selection">
                <div className="maintenance-selection-header">
                  <h3>Include Maintenance Records</h3>
                  <p className="maintenance-selection-hint">
                    Select buses to include their maintenance records in the report. Statistics and details update when you check or uncheck.
                  </p>
                </div>
                {loadingBusesForMaintenance ? (
                  <div className="maintenance-checkboxes">
                    <p style={{ padding: '15px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                      Loading buses...
                    </p>
                  </div>
                ) : (reportData && reportData.data && reportData.data.length > 0 ? (
                  <>
                    <div className="maintenance-checkboxes">
                      {reportData.data.map((bus) => (
                        <label key={bus.id} className="maintenance-checkbox-item">
                          <input
                            type="checkbox"
                            checked={selectedBusesForMaintenance.has(bus.id)}
                            onChange={(e) => {
                              const newSelection = new Set(selectedBusesForMaintenance);
                              if (e.target.checked) {
                                newSelection.add(bus.id);
                              } else {
                                newSelection.delete(bus.id);
                              }
                              setSelectedBusesForMaintenance(newSelection);
                              handleMaintenanceToggle(newSelection, bus.id, e.target.checked);
                            }}
                          />
                          <span className="checkbox-label">
                            <strong>{bus.bus_number}</strong> - {bus.registration_number}
                            {bus.maintenanceRecords && bus.maintenanceRecords.length > 0 && (
                              <span className="record-count"> ({bus.maintenanceRecords.length} records)</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="selection-actions">
                      <button
                        className="select-all-btn"
                        onClick={() => {
                          const allBusIds = new Set(reportData.data.map(bus => bus.id));
                          setSelectedBusesForMaintenance(allBusIds);
                          handleMaintenanceToggle(allBusIds);
                        }}
                      >
                        Select All
                      </button>
                      <button
                        className="deselect-all-btn"
                        onClick={() => {
                          setSelectedBusesForMaintenance(new Set());
                          handleMaintenanceToggle(new Set());
                        }}
                      >
                        Deselect All
                      </button>
                    </div>
                  </>
                ) : busListForMaintenance.length > 0 ? (
                  <>
                    <div className="maintenance-checkboxes">
                      {busListForMaintenance.map((bus) => (
                        <label key={bus.id} className="maintenance-checkbox-item">
                          <input
                            type="checkbox"
                            checked={selectedBusesForMaintenance.has(bus.id)}
                            onChange={(e) => {
                              const newSelection = new Set(selectedBusesForMaintenance);
                              if (e.target.checked) {
                                newSelection.add(bus.id);
                              } else {
                                newSelection.delete(bus.id);
                              }
                              setSelectedBusesForMaintenance(newSelection);
                            }}
                          />
                          <span className="checkbox-label">
                            <strong>{bus.bus_number}</strong> - {bus.registration_number}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="selection-actions">
                      <button
                        className="select-all-btn"
                        onClick={() => {
                          setSelectedBusesForMaintenance(new Set(busListForMaintenance.map(bus => bus.id)));
                        }}
                      >
                        Select All
                      </button>
                      <button
                        className="deselect-all-btn"
                        onClick={() => setSelectedBusesForMaintenance(new Set())}
                      >
                        Deselect All
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="maintenance-checkboxes">
                    <p style={{ padding: '15px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                      No buses available. Add buses in Transport or generate report to see options.
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Generate Report Button - Show below Include Maintenance Records for transport reports */}
            {reportType === 'transport' ? (
              <div className="generate-btn-container-transport">
                <button
                  className="generate-btn"
                  onClick={handleGenerateReport}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            ) : (
              <button
                className="generate-btn"
                onClick={handleGenerateReport}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            )}
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Report Display */}
          {reportData && (
            <div className="report-display">
              <div className="report-header">
                <h2>
                  {reportType === 'student' && 'Student Report'}
                  {reportType === 'staff' && 'Staff Report'}
                  {reportType === 'transport' && 'Transport Report'}
                </h2>
                {reportType !== 'transport' && (
                  <div className="report-actions">
                    <button className="download-btn" onClick={handleDownloadPDF}>
                      Download PDF
                    </button>
                  </div>
                )}
              </div>

              {/* Statistics */}
              {reportData.statistics && (
                <div className="report-statistics">
                  <h3>Statistics</h3>
                  <div className="stats-grid">
                    {Object.entries(reportData.statistics).map(([key, value]) => {
                      if (typeof value === 'object' && !Array.isArray(value)) return null;
                      if (key === 'byClass' || key === 'bySection' || key === 'byDesignation' || key === 'byRoute') return null;
                      return (
                        <div key={key} className="stat-card">
                          <div className="stat-value">{value}</div>
                          <div className="stat-label">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* Transport Maintenance Alerts */}
              {reportType === 'transport' && reportData.maintenanceAlerts && reportData.maintenanceAlerts.length > 0 && (
                <div className="maintenance-alerts">
                  <h3>Maintenance Alerts</h3>
                  <div className="alerts-list">
                    {reportData.maintenanceAlerts.map((bus, idx) => (
                      <div key={idx} className="alert-item">
                        <strong>{bus.bus_number}</strong> - Documents expiring within 2 months
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Table */}
              {reportData.data && reportData.data.length > 0 ? (
                <div className="report-table-container">
                  <h3>Details</h3>
                  <div className="report-table-wrapper">
                    <table className="report-table">
                      <thead>
                        {reportType === 'student' && (
                          <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Section</th>
                            <th>Contact</th>
                            <th>Email</th>
                            <th>Status</th>
                          </tr>
                        )}
                        {reportType === 'staff' && (
                          <tr>
                            <th>Name</th>
                            <th>Designation</th>
                            <th>Email</th>
                            <th>Contact</th>
                            <th>Experience</th>
                            <th>Class/Section</th>
                            <th>Status</th>
                          </tr>
                        )}
                        {reportType === 'transport' && (
                          <tr>
                            {selectedFields.bus_number && <th>Bus Number</th>}
                            {selectedFields.registration_number && <th>Registration</th>}
                            {selectedFields.chassis_number && <th>Chassis Number</th>}
                            {selectedFields.engine_number && <th>Engine Number</th>}
                            {selectedFields.driver_name && <th>Driver</th>}
                            {selectedFields.driver_contact && <th>Driver Contact</th>}
                            {selectedFields.route_name && <th>Route</th>}
                            {selectedFields.capacity && <th>Capacity</th>}
                            {selectedFields.vehicle_weight && <th>Vehicle Weight</th>}
                            {selectedFields.insurance_expiry && <th>Insurance Expiry</th>}
                            {selectedFields.fc_expiry && <th>FC Expiry</th>}
                            {selectedFields.permit_expiry && <th>Permit Expiry</th>}
                            {selectedFields.maintenance && <th>Maintenance</th>}
                            {selectedFields.status && <th>Status</th>}
                            <th>Actions</th>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {reportData.data.map((item, idx) => (
                          <tr key={idx}>
                            {reportType === 'student' && (
                              <>
                                <td>{item.student_id || '-'}</td>
                                <td>{item.name || '-'}</td>
                                <td>{item.class || '-'}</td>
                                <td>{item.section || '-'}</td>
                                <td>{item.phone || '-'}</td>
                                <td>{item.email || '-'}</td>
                                <td><span className={`status-${item.status?.toLowerCase()}`}>{item.status || '-'}</span></td>
                              </>
                            )}
                            {reportType === 'staff' && (
                              <>
                                <td>{item.staff_name || item.name || '-'}</td>
                                <td>{item.designation || '-'}</td>
                                <td>{item.email || '-'}</td>
                                <td>{item.contact || '-'}</td>
                                <td>{item.experience || 0} years</td>
                                <td>{item.class ? `${item.class} - ${item.section || ''}` : '-'}</td>
                                <td><span className={`status-${item.status?.toLowerCase()}`}>{item.status || '-'}</span></td>
                              </>
                            )}
                            {reportType === 'transport' && (
                              <>
                                {selectedFields.bus_number && <td>{item.bus_number || '-'}</td>}
                                {selectedFields.registration_number && <td>{item.registration_number || '-'}</td>}
                                {selectedFields.chassis_number && <td>{item.chassis_number || '-'}</td>}
                                {selectedFields.engine_number && <td>{item.engine_number || '-'}</td>}
                                {selectedFields.driver_name && <td>{item.driver_name || '-'}</td>}
                                {selectedFields.driver_contact && <td>{item.driver_contact || '-'}</td>}
                                {selectedFields.route_name && <td>{item.route_name || '-'}</td>}
                                {selectedFields.capacity && <td>{item.capacity || '-'}</td>}
                                {selectedFields.vehicle_weight && <td>{item.vehicle_weight ? `${item.vehicle_weight} kg` : '-'}</td>}
                                {selectedFields.insurance_expiry && (
                                  <td>
                                    <div className="document-info">
                                      <span className={item.insurance_expiry && new Date(item.insurance_expiry) < new Date() ? 'expired' : ''}>
                                        {item.insurance_expiry ? new Date(item.insurance_expiry).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedFields.fc_expiry && (
                                  <td>
                                    <div className="document-info">
                                      <span className={item.fc_expiry && new Date(item.fc_expiry) < new Date() ? 'expired' : ''}>
                                        {item.fc_expiry ? new Date(item.fc_expiry).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedFields.permit_expiry && (
                                  <td>
                                    <div className="document-info">
                                      <span className={item.permit_expiry && new Date(item.permit_expiry) < new Date() ? 'expired' : ''}>
                                        {item.permit_expiry ? new Date(item.permit_expiry).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedFields.maintenance && (
                                  <td>
                                    <div className="maintenance-info">
                                      {selectedBusesForMaintenance.has(item.id) ? (
                                        <>
                                          <span className="maintenance-count">
                                            {item.maintenanceCount || (item.maintenanceRecords ? item.maintenanceRecords.length : 0)} records
                                          </span>
                                          {(item.totalMaintenanceCost > 0 || (item.maintenanceRecords && item.maintenanceRecords.length > 0)) && (
                                            <span className="maintenance-cost">
                                              ₹{parseFloat(item.totalMaintenanceCost || 0).toFixed(2)}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="maintenance-excluded">Excluded</span>
                                      )}
                                    </div>
                                  </td>
                                )}
                                {selectedFields.status && <td><span className={`status-${item.status?.toLowerCase().replace(' ', '-')}`}>{item.status || '-'}</span></td>}
                                <td>
                                  {selectedBusesForMaintenance.has(item.id) && item.maintenanceRecords && item.maintenanceRecords.length > 0 && (
                                    <button 
                                      className="view-maintenance-btn"
                                      onClick={() => {
                                        const modal = document.createElement('div');
                                        modal.className = 'maintenance-modal-overlay';
                                        
                                        const closeBtn = document.createElement('button');
                                        closeBtn.textContent = '×';
                                        closeBtn.onclick = () => modal.remove();
                                        
                                        const modalContent = document.createElement('div');
                                        modalContent.className = 'maintenance-modal';
                                        
                                        const header = document.createElement('div');
                                        header.className = 'modal-header';
                                        header.innerHTML = `<h3>Maintenance Records - ${item.bus_number}</h3>`;
                                        header.appendChild(closeBtn);
                                        
                                        const body = document.createElement('div');
                                        body.className = 'modal-body';
                                        
                                        const table = document.createElement('table');
                                        table.className = 'maintenance-table';
                                        table.innerHTML = `
                                          <thead>
                                            <tr>
                                              <th>Date</th>
                                              <th>Type</th>
                                              <th>Description</th>
                                              <th>Cost</th>
                                              <th>Service Provider</th>
                                              <th>Next Maintenance</th>
                                              <th>Odometer</th>
                                              <th>Notes</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            ${item.maintenanceRecords.map(record => `
                                              <tr>
                                                <td>${record.maintenance_date ? new Date(record.maintenance_date).toLocaleDateString() : '-'}</td>
                                                <td>${record.maintenance_type || '-'}</td>
                                                <td>${record.description || '-'}</td>
                                                <td>₹${parseFloat(record.cost || 0).toFixed(2)}</td>
                                                <td>${record.service_provider || '-'}</td>
                                                <td>${record.next_maintenance_date ? new Date(record.next_maintenance_date).toLocaleDateString() : '-'}</td>
                                                <td>${record.odometer_reading || '-'}</td>
                                                <td>${record.notes || '-'}</td>
                                              </tr>
                                            `).join('')}
                                          </tbody>
                                        `;
                                        
                                        body.appendChild(table);
                                        modalContent.appendChild(header);
                                        modalContent.appendChild(body);
                                        modal.appendChild(modalContent);
                                        
                                        document.body.appendChild(modal);
                                        modal.addEventListener('click', (e) => {
                                          if (e.target === modal) modal.remove();
                                        });
                                      }}
                                    >
                                      View Maintenance
                                    </button>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="report-footer">
                    <p>Total Records: {reportData.data.length}</p>
                    <div className="report-footer-right">
                      <p>Generated on: {new Date(reportData.generatedAt).toLocaleString()}</p>
                      {reportType === 'transport' && (
                        <button className="download-btn download-btn-transport" onClick={handleDownloadPDF}>
                          Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-data">
                  <p>No data available for the selected filters.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReport;
