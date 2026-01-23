import { useState, useEffect } from 'react';
import './AdminTransport.css';
import Sidebar from '../../components/layout/Sidebar';
import {
  getAllBuses,
  createBus,
  updateBus,
  deleteBus,
  getBusById,
  getBusesWithExpiringDocuments,
  getBusMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance
} from '../../services/transport.service.js';

/* Admin Transport Dashboard Page */
const AdminTransport = () => {
  const [buses, setBuses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showBusDetails, setShowBusDetails] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [maintenanceFilter, setMaintenanceFilter] = useState({ type: 'all' }); // 'all', 'date', 'month'
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [busToDelete, setBusToDelete] = useState(null);

  // Fetch buses and alerts on component mount
  useEffect(() => {
    fetchBuses();
    fetchAlerts();
  }, []);

  // Filter buses based on search and status
  useEffect(() => {
    let filtered = [...buses];

    // Filter by status
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(bus => bus.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(bus =>
        bus.bus_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.route_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by bus number in ascending order
    filtered.sort((a, b) => {
      const busNumA = a.bus_number || '';
      const busNumB = b.bus_number || '';
      
      // Extract numeric part if exists, otherwise use string comparison
      const numA = parseInt(busNumA.match(/\d+/)?.[0] || '0');
      const numB = parseInt(busNumB.match(/\d+/)?.[0] || '0');
      
      // If both have numbers, compare numerically
      if (numA !== 0 && numB !== 0) {
        return numA - numB;
      }
      
      // Otherwise, compare as strings
      return busNumA.localeCompare(busNumB, undefined, { numeric: true, sensitivity: 'base' });
    });

    setFilteredBuses(filtered);
  }, [buses, searchTerm, selectedStatus]);

  const [filteredBuses, setFilteredBuses] = useState([]);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const data = await getAllBuses();
      setBuses(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await getBusesWithExpiringDocuments(2);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const handleAddBus = () => {
    setEditingBus(null);
    setShowAddForm(true);
  };

  const handleViewBus = async (id) => {
    try {
      const bus = await getBusById(id);
      setSelectedBus(bus);
      setShowBusDetails(true);
      await fetchMaintenanceRecords(id);
    } catch (err) {
      setError(err.message || 'Failed to fetch bus details');
    }
  };

  const handleEditBus = async (id) => {
    try {
      const bus = await getBusById(id);
      setEditingBus(bus);
      setShowAddForm(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch bus details');
    }
  };

  const handleMaintenanceEntry = async (id) => {
    try {
      const bus = await getBusById(id);
      setSelectedBus(bus);
      setShowMaintenanceForm(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch bus details');
    }
  };

  const fetchMaintenanceRecords = async (busId) => {
    try {
      let records;
      if (maintenanceFilter.type === 'date' && filterDate) {
        records = await getBusMaintenance(busId, { startDate: filterDate, endDate: filterDate });
      } else if (maintenanceFilter.type === 'month' && filterMonth && filterYear) {
        records = await getBusMaintenance(busId, { year: filterYear, month: filterMonth });
      } else {
        records = await getBusMaintenance(busId);
      }
      setMaintenanceRecords(records);
    } catch (err) {
      console.error('Failed to fetch maintenance records:', err);
      setMaintenanceRecords([]);
    }
  };

  const handleMaintenanceFilterChange = async (filterType) => {
    setMaintenanceFilter({ type: filterType });
    if (selectedBus) {
      if (filterType === 'all') {
        setFilterDate('');
        setFilterMonth('');
        const records = await getBusMaintenance(selectedBus.id);
        setMaintenanceRecords(records);
      }
    }
  };

  const handleApplyMaintenanceFilter = async () => {
    if (selectedBus) {
      await fetchMaintenanceRecords(selectedBus.id);
    }
  };

  const handleDeleteBus = (id) => {
    const bus = buses.find(b => b.id === id);
    setBusToDelete(bus);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBus = async () => {
    if (!busToDelete) return;

    try {
      setLoading(true);
      await deleteBus(busToDelete.id);
      await fetchBuses();
      await fetchAlerts();
      setError('');
      setShowDeleteConfirm(false);
      setBusToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete bus');
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteBus = () => {
    setShowDeleteConfirm(false);
    setBusToDelete(null);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingBus(null);
  };

  const handleSubmitForm = async (busData) => {
    try {
      if (editingBus) {
        await updateBus(editingBus.id, busData);
      } else {
        await createBus(busData);
      }
      setShowAddForm(false);
      setEditingBus(null);
      await fetchBuses();
      await fetchAlerts();
    } catch (err) {
      throw err;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#dc3545';
      case 'urgent':
        return '#fd7e14';
      case 'warning':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'critical':
        return 'Critical';
      case 'urgent':
        return 'Urgent';
      case 'warning':
        return 'Warning';
      default:
        return 'Info';
    }
  };

  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case 'insurance':
        return 'Insurance';
      case 'fc':
        return 'Fitness Certificate';
      case 'permit':
        return 'Permit';
      default:
        return type;
    }
  };

  // Count alerts by severity
  const criticalAlerts = alerts.flatMap(bus => bus.alerts || []).filter(a => a.severity === 'critical').length;
  const urgentAlerts = alerts.flatMap(bus => bus.alerts || []).filter(a => a.severity === 'urgent').length;
  const warningAlerts = alerts.flatMap(bus => bus.alerts || []).filter(a => a.severity === 'warning').length;

  return (
    <div className='transport-container'>
      <Sidebar />
      <div className="transport-page">
        <header className="transport-header">
          <h1>Transport Details</h1>
        </header>

        <main className="transport-content">

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="alerts-section">
              <h3 className="alerts-title">
                <span className="alert-icon"></span> Expiring Documents Alerts
              </h3>
              <div className="alerts-summary">
                {criticalAlerts > 0 && (
                  <div className="alert-summary-item critical">
                    <span className="alert-count">{criticalAlerts}</span>
                    <span className="alert-label">Expired</span>
                  </div>
                )}
                {urgentAlerts > 0 && (
                  <div className="alert-summary-item urgent">
                    <span className="alert-count">{urgentAlerts}</span>
                    <span className="alert-label">Urgent (≤30 days)</span>
                  </div>
                )}
                {warningAlerts > 0 && (
                  <div className="alert-summary-item warning">
                    <span className="alert-count">{warningAlerts}</span>
                    <span className="alert-label">Warning (≤60 days)</span>
                  </div>
                )}
              </div>
              <div className="alerts-list">
                {alerts.map((bus) => (
                  bus.alerts && bus.alerts.length > 0 && (
                    <div key={bus.id} className="alert-card">
                      <div className="alert-card-header">
                        <h4>Bus: {bus.bus_number} ({bus.registration_number})</h4>
                        <span className={`bus-status ${bus.status?.toLowerCase()}`}>
                          {bus.status}
                        </span>
                      </div>
                      <div className="alert-items">
                        {bus.alerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className="alert-item"
                            style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                          >
                            <div className="alert-item-content">
                              <div className="alert-type">
                                <span className="alert-type-label">{getDocumentTypeLabel(alert.type)}</span>
                                <span
                                  className="alert-severity"
                                  style={{ backgroundColor: getSeverityColor(alert.severity) }}
                                >
                                  {getSeverityLabel(alert.severity)}
                                </span>
                              </div>
                              <div className="alert-message">{alert.message}</div>
                              <div className="alert-date">
                                Expiry Date: {formatDate(alert.expiryDate)}
                                {alert.daysUntilExpiry > 0 && (
                                  <span> ({alert.daysUntilExpiry} days remaining)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="transport-filters">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${selectedStatus === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedStatus('All')}
              >
                All
              </button>
              <button
                className={`filter-btn ${selectedStatus === 'Active' ? 'active' : ''}`}
                onClick={() => setSelectedStatus('Active')}
              >
                Active
              </button>
              <button
                className={`filter-btn ${selectedStatus === 'Inactive' ? 'active' : ''}`}
                onClick={() => setSelectedStatus('Inactive')}
              >
                Inactive
              </button>
              <button
                className={`filter-btn ${selectedStatus === 'Under Maintenance' ? 'active' : ''}`}
                onClick={() => setSelectedStatus('Under Maintenance')}
              >
                Under Maintenance
              </button>
            </div>
            <div className="search-promote-section">
              <div className="promote-add-buttons">
                <button className="add-bus-btn" onClick={handleAddBus}>Add Bus</button>
              </div>
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Buses Table */}
          <section className="transport-table-section">
            {loading ? (
              <div className="loading-message">Loading buses...</div>
            ) : filteredBuses.length === 0 ? (
              <div className="transport-table-placeholder">
                <p className="placeholder-message">No buses found. Click "Add Bus" to add a new bus.</p>
              </div>
            ) : (
              <div className="transport-table">
                <table>
                  <thead>
                    <tr>
                      <th>S.no</th>
                      <th>Bus Number</th>
                      <th>Registration</th>
                      <th>Driver</th>
                      <th>Route</th>
                      <th>Insurance Expiry</th>
                      <th>FC Expiry</th>
                      <th>Permit Expiry</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBuses.map((bus, index) => {
                      const busAlerts = alerts.find(b => b.id === bus.id)?.alerts || [];
                      const hasAlerts = busAlerts.length > 0;
                      
                      return (
                        <tr 
                          key={bus.id} 
                          className={`${hasAlerts ? 'has-alerts' : ''} clickable-row`}
                          onClick={() => handleViewBus(bus.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{(index + 1).toString().padStart(2, '0')}</td>
                          <td>
                            {bus.bus_number}
                            {hasAlerts && <span className="alert-indicator">⚠️</span>}
                          </td>
                          <td>{bus.registration_number}</td>
                          <td>{bus.driver_name || '-'}</td>
                          <td>{bus.route_name || '-'}</td>
                          <td className={busAlerts.some(a => a.type === 'insurance') ? 'expiring' : ''}>
                            {formatDate(bus.insurance_expiry)}
                          </td>
                          <td className={busAlerts.some(a => a.type === 'fc') ? 'expiring' : ''}>
                            {formatDate(bus.fc_expiry)}
                          </td>
                          <td className={busAlerts.some(a => a.type === 'permit') ? 'expiring' : ''}>
                            {formatDate(bus.permit_expiry)}
                          </td>
                          <td>
                            <span className={`status-badge ${bus.status?.toLowerCase()}`}>
                              {bus.status}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="action-buttons">
                              <button
                                className="action-btn update-btn"
                                onClick={() => handleEditBus(bus.id)}
                              >
                                Update
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteBus(bus.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Add/Edit Bus Form Modal */}
      {showAddForm && (
        <BusForm
          bus={editingBus}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isEditing={!!editingBus}
        />
      )}

      {/* Bus Details Modal */}
      {showBusDetails && selectedBus && (
        <BusDetailsModal
          bus={selectedBus}
          maintenanceRecords={maintenanceRecords}
          maintenanceFilter={maintenanceFilter}
          filterDate={filterDate}
          filterMonth={filterMonth}
          filterYear={filterYear}
          onClose={() => {
            setShowBusDetails(false);
            setSelectedBus(null);
            setMaintenanceRecords([]);
            setMaintenanceFilter({ type: 'all' });
          }}
          onMaintenanceEntry={() => {
            setShowBusDetails(false);
            setShowMaintenanceForm(true);
          }}
          onFilterChange={handleMaintenanceFilterChange}
          onDateChange={setFilterDate}
          onMonthChange={setFilterMonth}
          onYearChange={setFilterYear}
          onApplyFilter={handleApplyMaintenanceFilter}
          onRefresh={() => fetchMaintenanceRecords(selectedBus.id)}
        />
      )}

      {/* Maintenance Entry Form Modal */}
      {showMaintenanceForm && selectedBus && (
        <MaintenanceForm
          bus={selectedBus}
          onClose={() => {
            setShowMaintenanceForm(false);
            setSelectedBus(null);
          }}
          onSubmit={async (maintenanceData) => {
            try {
              await createMaintenance(maintenanceData);
              setShowMaintenanceForm(false);
              if (selectedBus) {
                await fetchMaintenanceRecords(selectedBus.id);
                setShowBusDetails(true);
              }
            } catch (err) {
              throw err;
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && busToDelete && (
        <DeleteConfirmModal
          bus={busToDelete}
          onConfirm={confirmDeleteBus}
          onCancel={cancelDeleteBus}
          loading={loading}
        />
      )}
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ bus, onConfirm, onCancel, loading }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-confirm-header">
          <h3>Confirm Deletion</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        <div className="delete-confirm-body">
          <div className="delete-warning-icon">⚠️</div>
          <p>
            Are you sure you want to delete the bus <strong>{bus.bus_number}</strong> ({bus.registration_number})?
          </p>
          <p className="delete-warning-text">
            This action cannot be undone. All maintenance records associated with this bus will also be deleted.
          </p>
        </div>
        <div className="delete-confirm-actions">
          <button 
            className="cancel-delete-btn" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="confirm-delete-btn" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Bus'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Bus Form Component
const BusForm = ({ bus, onClose, onSubmit, isEditing = false }) => {
  const [formData, setFormData] = useState({
    bus_number: '',
    registration_number: '',
    chassis_number: '',
    engine_number: '',
    driver_name: '',
    driver_contact: '',
    route_name: '',
    capacity: '',
    vehicle_weight: '',
    insurance_expiry: '',
    fc_expiry: '',
    permit_expiry: '',
    status: 'Active'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bus) {
      setFormData({
        bus_number: bus.bus_number || '',
        registration_number: bus.registration_number || '',
        chassis_number: bus.chassis_number || '',
        engine_number: bus.engine_number || '',
        driver_name: bus.driver_name || '',
        driver_contact: bus.driver_contact || '',
        route_name: bus.route_name || '',
        capacity: bus.capacity || '',
        vehicle_weight: bus.vehicle_weight || '',
        insurance_expiry: bus.insurance_expiry ? bus.insurance_expiry.split('T')[0] : '',
        fc_expiry: bus.fc_expiry ? bus.fc_expiry.split('T')[0] : '',
        permit_expiry: bus.permit_expiry ? bus.permit_expiry.split('T')[0] : '',
        status: bus.status || 'Active'
      });
    }
  }, [bus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.bus_number.trim()) {
      newErrors.bus_number = 'Bus number is required';
    }
    if (!formData.registration_number.trim()) {
      newErrors.registration_number = 'Registration number is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bus-form-overlay" onClick={onClose}>
      <div className="bus-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bus-form-header">
          <h2>{isEditing ? 'Edit Bus' : 'Add Bus'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="bus-form">
          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <div className="form-columns">
            <div className="form-column-left">
              <div className="form-group">
                <label htmlFor="bus_number">Bus Number *</label>
                <input
                  type="text"
                  id="bus_number"
                  name="bus_number"
                  value={formData.bus_number}
                  onChange={handleChange}
                  required
                />
                {errors.bus_number && <span className="error-text">{errors.bus_number}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="registration_number">Registration Number *</label>
                <input
                  type="text"
                  id="registration_number"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  required
                />
                {errors.registration_number && <span className="error-text">{errors.registration_number}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="chassis_number">Chassis Number</label>
                <input
                  type="text"
                  id="chassis_number"
                  name="chassis_number"
                  value={formData.chassis_number}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="engine_number">Engine Number</label>
                <input
                  type="text"
                  id="engine_number"
                  name="engine_number"
                  value={formData.engine_number}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="driver_name">Driver Name</label>
                <input
                  type="text"
                  id="driver_name"
                  name="driver_name"
                  value={formData.driver_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="driver_contact">Driver Contact</label>
                <input
                  type="tel"
                  id="driver_contact"
                  name="driver_contact"
                  value={formData.driver_contact}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="route_name">Route Name</label>
                <input
                  type="text"
                  id="route_name"
                  name="route_name"
                  value={formData.route_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-column-right">
              <div className="form-group">
                <label htmlFor="capacity">Capacity</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicle_weight">Vehicle Weight (kg)</label>
                <input
                  type="number"
                  id="vehicle_weight"
                  name="vehicle_weight"
                  value={formData.vehicle_weight}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="insurance_expiry">Insurance Expiry Date</label>
                <input
                  type="date"
                  id="insurance_expiry"
                  name="insurance_expiry"
                  value={formData.insurance_expiry}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fc_expiry">Fitness Certificate (FC) Expiry Date</label>
                <input
                  type="date"
                  id="fc_expiry"
                  name="fc_expiry"
                  value={formData.fc_expiry}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="permit_expiry">Permit Expiry Date</label>
                <input
                  type="date"
                  id="permit_expiry"
                  name="permit_expiry"
                  value={formData.permit_expiry}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Bus Details Modal Component
const BusDetailsModal = ({
  bus,
  maintenanceRecords,
  maintenanceFilter,
  filterDate,
  filterMonth,
  filterYear,
  onClose,
  onMaintenanceEntry,
  onFilterChange,
  onDateChange,
  onMonthChange,
  onYearChange,
  onApplyFilter,
  onRefresh
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bus-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Bus Details - {bus.bus_number}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Bus Information */}
          <div className="bus-info-section">
            <h3>Bus Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Bus Number:</label>
                <span>{bus.bus_number}</span>
              </div>
              <div className="info-item">
                <label>Registration Number:</label>
                <span>{bus.registration_number}</span>
              </div>
              <div className="info-item">
                <label>Chassis Number:</label>
                <span>{bus.chassis_number || '-'}</span>
              </div>
              <div className="info-item">
                <label>Engine Number:</label>
                <span>{bus.engine_number || '-'}</span>
              </div>
              <div className="info-item">
                <label>Driver Name:</label>
                <span>{bus.driver_name || '-'}</span>
              </div>
              <div className="info-item">
                <label>Driver Contact:</label>
                <span>{bus.driver_contact || '-'}</span>
              </div>
              <div className="info-item">
                <label>Route:</label>
                <span>{bus.route_name || '-'}</span>
              </div>
              <div className="info-item">
                <label>Capacity:</label>
                <span>{bus.capacity || '-'}</span>
              </div>
              <div className="info-item">
                <label>Vehicle Weight:</label>
                <span>{bus.vehicle_weight ? `${bus.vehicle_weight} kg` : '-'}</span>
              </div>
              <div className="info-item">
                <label>Insurance Expiry:</label>
                <span>{formatDate(bus.insurance_expiry)}</span>
              </div>
              <div className="info-item">
                <label>FC Expiry:</label>
                <span>{formatDate(bus.fc_expiry)}</span>
              </div>
              <div className="info-item">
                <label>Permit Expiry:</label>
                <span>{formatDate(bus.permit_expiry)}</span>
              </div>
              <div className="info-item">
                <label>Status:</label>
                <span className={`status-badge ${bus.status?.toLowerCase()}`}>
                  {bus.status}
                </span>
              </div>
            </div>
          </div>

          {/* Maintenance Section */}
          <div className="maintenance-section">
            <div className="maintenance-header">
              <h3>Maintenance Records</h3>
              <button className="maintenance-entry-btn" onClick={onMaintenanceEntry}>
                + Maintenance Entry
              </button>
            </div>

            {/* Maintenance Filters */}
            <div className="maintenance-filters">
              <div className="filter-options">
                <button
                  className={`filter-option-btn ${maintenanceFilter.type === 'all' ? 'active' : ''}`}
                  onClick={() => onFilterChange('all')}
                >
                  All Records
                </button>
                <button
                  className={`filter-option-btn ${maintenanceFilter.type === 'date' ? 'active' : ''}`}
                  onClick={() => onFilterChange('date')}
                >
                  By Date
                </button>
                <button
                  className={`filter-option-btn ${maintenanceFilter.type === 'month' ? 'active' : ''}`}
                  onClick={() => onFilterChange('month')}
                >
                  By Month
                </button>
              </div>

              {maintenanceFilter.type === 'date' && (
                <div className="filter-inputs">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="filter-input"
                  />
                  <button className="apply-filter-btn" onClick={onApplyFilter}>
                    Apply
                  </button>
                </div>
              )}

              {maintenanceFilter.type === 'month' && (
                <div className="filter-inputs">
                  <select
                    value={filterMonth}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className="filter-input"
                  >
                    <option value="">Select Month</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                  <input
                    type="number"
                    value={filterYear}
                    onChange={(e) => onYearChange(e.target.value)}
                    placeholder="Year"
                    className="filter-input"
                    min="2000"
                    max="2100"
                  />
                  <button className="apply-filter-btn" onClick={onApplyFilter}>
                    Apply
                  </button>
                </div>
              )}

              <button className="refresh-btn" onClick={onRefresh}>
                Refresh
              </button>
            </div>

            {/* Maintenance Records Table */}
            <div className="maintenance-records">
              {maintenanceRecords.length === 0 ? (
                <p className="no-records">No maintenance records found.</p>
              ) : (
                <table className="maintenance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Cost</th>
                      <th>Service Provider</th>
                      <th>Next Maintenance</th>
                      <th>Odometer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{formatDate(record.maintenance_date)}</td>
                        <td>{record.maintenance_type}</td>
                        <td>{record.description || '-'}</td>
                        <td>{formatCurrency(record.cost)}</td>
                        <td>{record.service_provider || '-'}</td>
                        <td>{formatDate(record.next_maintenance_date)}</td>
                        <td>{record.odometer_reading || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Maintenance Form Component
const MaintenanceForm = ({ bus, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    bus_id: bus.id,
    maintenance_date: new Date().toISOString().split('T')[0],
    maintenance_type: '',
    description: '',
    cost: '',
    service_provider: '',
    next_maintenance_date: '',
    odometer_reading: '',
    notes: ''
  });
  const [customMaintenanceType, setCustomMaintenanceType] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear custom maintenance type when a different option is selected
    if (name === 'maintenance_type' && value !== 'Other') {
      setCustomMaintenanceType('');
    }
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCustomTypeChange = (e) => {
    setCustomMaintenanceType(e.target.value);
    if (errors.custom_maintenance_type) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.custom_maintenance_type;
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.maintenance_date) {
      newErrors.maintenance_date = 'Maintenance date is required';
    }
    if (!formData.maintenance_type.trim()) {
      newErrors.maintenance_type = 'Maintenance type is required';
    }
    // Validate custom maintenance type if "Other" is selected
    if (formData.maintenance_type === 'Other' && !customMaintenanceType.trim()) {
      newErrors.custom_maintenance_type = 'Please specify the maintenance type';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        // Use custom maintenance type if "Other" is selected
        maintenance_type: formData.maintenance_type === 'Other' ? customMaintenanceType.trim() : formData.maintenance_type,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : null
      };
      await onSubmit(submitData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content maintenance-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Maintenance Entry - {bus.bus_number}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="maintenance-form">
          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="maintenance_date">Maintenance Date *</label>
              <input
                type="date"
                id="maintenance_date"
                name="maintenance_date"
                value={formData.maintenance_date}
                onChange={handleChange}
                required
              />
              {errors.maintenance_date && <span className="error-text">{errors.maintenance_date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="maintenance_type">Maintenance Type *</label>
              <select
                id="maintenance_type"
                name="maintenance_type"
                value={formData.maintenance_type}
                onChange={handleChange}
                required
              >
                <option value="">Select Type</option>
                <option value="Regular Service">Regular Service</option>
                <option value="Oil Change">Oil Change</option>
                <option value="Tire Replacement">Tire Replacement</option>
                <option value="Brake Service">Brake Service</option>
                <option value="Engine Repair">Engine Repair</option>
                <option value="Body Repair">Body Repair</option>
                <option value="Electrical">Electrical</option>
                <option value="AC Service">AC Service</option>
                <option value="Battery Replacement">Battery Replacement</option>
                <option value="Other">Other</option>
              </select>
              {errors.maintenance_type && <span className="error-text">{errors.maintenance_type}</span>}
            </div>
          </div>

          {/* Custom Maintenance Type Input - Shows when "Other" is selected */}
          {formData.maintenance_type === 'Other' && (
            <div className="form-group">
              <label htmlFor="custom_maintenance_type">Specify Maintenance Type *</label>
              <input
                type="text"
                id="custom_maintenance_type"
                name="custom_maintenance_type"
                value={customMaintenanceType}
                onChange={handleCustomTypeChange}
                placeholder="Enter maintenance type..."
                required={formData.maintenance_type === 'Other'}
              />
              {errors.custom_maintenance_type && <span className="error-text">{errors.custom_maintenance_type}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Enter maintenance description..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cost">Cost (₹)</label>
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="service_provider">Service Provider</label>
              <input
                type="text"
                id="service_provider"
                name="service_provider"
                value={formData.service_provider}
                onChange={handleChange}
                placeholder="Service provider name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="next_maintenance_date">Next Maintenance Date</label>
              <input
                type="date"
                id="next_maintenance_date"
                name="next_maintenance_date"
                value={formData.next_maintenance_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="odometer_reading">Odometer Reading (km)</label>
              <input
                type="number"
                id="odometer_reading"
                name="odometer_reading"
                value={formData.odometer_reading}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Maintenance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminTransport;
