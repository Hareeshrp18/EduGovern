import { useState } from 'react';
import './AdminReport.css';
import Sidebar from '../../components/layout/Sidebar';
import {
  generateStudentReport,
  generateStaffReport,
  generateTransportReport
} from '../../services/report.service.js';

const AdminReport = () => {
  const [reportType, setReportType] = useState('student');
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    status: '',
    designation: ''
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError('');
      setReportData(null);

      let report;
      const reportFilters = {};

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

    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    const htmlContent = generateHTMLReport(reportData, reportType);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadCSV = () => {
    if (!reportData) return;

    let csv = '';
    if (reportType === 'student') {
      csv = generateStudentCSV(reportData.data);
    } else if (reportType === 'staff') {
      csv = generateStaffCSV(reportData.data);
    } else if (reportType === 'transport') {
      csv = generateTransportCSV(reportData.data);
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
            <td>${item.name || ''}</td>
            <td>${item.designation || ''}</td>
            <td>${item.email || ''}</td>
            <td>${item.contact || ''}</td>
            <td>${item.experience || 0} years</td>
            <td>${item.status || ''}</td>
          </tr>`;
        });
      } else if (type === 'transport') {
        content += '<tr><th>Bus Number</th><th>Registration</th><th>Driver</th><th>Route</th><th>Capacity</th><th>Status</th></tr>';
        data.data.forEach(item => {
          content += `<tr>
            <td>${item.bus_number || ''}</td>
            <td>${item.registration_number || ''}</td>
            <td>${item.driver_name || ''}</td>
            <td>${item.route_name || ''}</td>
            <td>${item.capacity || ''}</td>
            <td>${item.status || ''}</td>
          </tr>`;
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
      csv += `${item.name || ''},${item.designation || ''},${item.email || ''},${item.contact || ''},${item.experience || 0},${item.status || ''}\n`;
    });
    return csv;
  };

  const generateTransportCSV = (data) => {
    let csv = 'Bus Number,Registration,Driver,Driver Contact,Route,Capacity,Insurance Expiry,FC Expiry,Permit Expiry,Status\n';
    data.forEach(item => {
      csv += `${item.bus_number || ''},${item.registration_number || ''},${item.driver_name || ''},${item.driver_contact || ''},${item.route_name || ''},${item.capacity || ''},${item.insurance_expiry || ''},${item.fc_expiry || ''},${item.permit_expiry || ''},${item.status || ''}\n`;
    });
    return csv;
  };

  return (
    <div className='reports-container'>
      <Sidebar />
      <div className='reports-page'>
        <header className="reports-header">
          <h1>Report Generation</h1>
          <p>Generate and download reports for students, staff, and transport</p>
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
                  setFilters({ class: '', section: '', status: '', designation: '' });
                }}
              >
                📚 Student Report
              </button>
              <button
                className={`type-btn ${reportType === 'staff' ? 'active' : ''}`}
                onClick={() => {
                  setReportType('staff');
                  setReportData(null);
                  setFilters({ class: '', section: '', status: '', designation: '' });
                }}
              >
                👨‍🏫 Staff Report
              </button>
              <button
                className={`type-btn ${reportType === 'transport' ? 'active' : ''}`}
                onClick={() => {
                  setReportType('transport');
                  setReportData(null);
                  setFilters({ class: '', section: '', status: '', designation: '' });
                }}
              >
                🚌 Transport Report
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
                      onChange={(e) => setFilters({ ...filters, class: e.target.value })}
                    >
                      <option value="">All Classes</option>
                      <option value="1st">1st</option>
                      <option value="2nd">2nd</option>
                      <option value="3rd">3rd</option>
                      <option value="4th">4th</option>
                      <option value="5th">5th</option>
                      <option value="6th">6th</option>
                      <option value="7th">7th</option>
                      <option value="8th">8th</option>
                      <option value="9th">9th</option>
                      <option value="10th">10th</option>
                      <option value="11th">11th</option>
                      <option value="12th">12th</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Section</label>
                    <select
                      value={filters.section}
                      onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                    >
                      <option value="">All Sections</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
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
            </div>

            <button
              className="generate-btn"
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Report Display */}
          {reportData && (
            <div className="report-display">
              <div className="report-header">
                <h2>
                  {reportType === 'student' && '📚 Student Report'}
                  {reportType === 'staff' && '👨‍🏫 Staff Report'}
                  {reportType === 'transport' && '🚌 Transport Report'}
                </h2>
                <div className="report-actions">
                  <button className="download-btn" onClick={handleDownloadPDF}>
                    📄 Download PDF
                  </button>
                  <button className="download-btn" onClick={handleDownloadCSV}>
                    📊 Download CSV
                  </button>
                </div>
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
                  <h3>⚠️ Maintenance Alerts</h3>
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
                            <th>Bus Number</th>
                            <th>Registration</th>
                            <th>Driver</th>
                            <th>Driver Contact</th>
                            <th>Route</th>
                            <th>Capacity</th>
                            <th>Insurance Expiry</th>
                            <th>FC Expiry</th>
                            <th>Permit Expiry</th>
                            <th>Status</th>
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
                                <td><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status || '-'}</span></td>
                              </>
                            )}
                            {reportType === 'staff' && (
                              <>
                                <td>{item.name || '-'}</td>
                                <td>{item.designation || '-'}</td>
                                <td>{item.email || '-'}</td>
                                <td>{item.contact || '-'}</td>
                                <td>{item.experience || 0} years</td>
                                <td>{item.class ? `${item.class} - ${item.section || ''}` : '-'}</td>
                                <td><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status || '-'}</span></td>
                              </>
                            )}
                            {reportType === 'transport' && (
                              <>
                                <td>{item.bus_number || '-'}</td>
                                <td>{item.registration_number || '-'}</td>
                                <td>{item.driver_name || '-'}</td>
                                <td>{item.driver_contact || '-'}</td>
                                <td>{item.route_name || '-'}</td>
                                <td>{item.capacity || '-'}</td>
                                <td>{item.insurance_expiry || '-'}</td>
                                <td>{item.fc_expiry || '-'}</td>
                                <td>{item.permit_expiry || '-'}</td>
                                <td><span className={`status-badge ${item.status?.toLowerCase().replace(' ', '-')}`}>{item.status || '-'}</span></td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="report-footer">
                    <p>Total Records: {reportData.data.length}</p>
                    <p>Generated on: {new Date(reportData.generatedAt).toLocaleString()}</p>
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
