import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { getDashboardStats } from '../../services/dashboard.service.js';
import './AdminDashboard.css';

/* Admin Dashboard Page*/
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, onClick, subtitle }) => (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-card-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <div className="stat-card-value">{value}</div>
        {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-main">
          <main className="dashboard-content">
            <div className="loading-message">Loading dashboard...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <main className="dashboard-content">
          <div className="dashboard-header">
            <h1>Dashboard</h1>
            <p className="dashboard-subtitle"></p>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {stats && (
            <>
              {/* Main Statistics Cards */}
              <div className="stats-grid">
                <StatCard
                  title="Total Students"
                  value={stats.students?.total || 0}
                  onClick={() => navigate('/admin/students')}
                  subtitle={`${stats.students?.active || 0} Active`}
                />
                <StatCard
                  title="Total Staff"
                  value={stats.faculty?.total || 0}
                  onClick={() => navigate('/admin/faculty')}
                  subtitle={`${stats.faculty?.active || 0} Active`}
                />
                <StatCard
                  title="Transport Vehicles"
                  value={stats.transport?.total || 0}
                  onClick={() => navigate('/admin/transport')}
                  subtitle={`${stats.transport?.active || 0} Active`}
                />
                <StatCard
                  title="Announcements"
                  value={stats.announcements?.total || 0}
                  onClick={() => navigate('/admin/announcements')}
                  subtitle={`${stats.announcements?.published || 0} Published`}
                />
              </div>

              {/* Detailed Statistics */}
              <div className="detailed-stats">
                {/* Students and Staff detail cards hidden - do not show on dashboard
                <div className="detail-card">
                  <h3 className="detail-card-title">
                    <span className="detail-icon"></span> Students
                  </h3>
                  <div className="detail-stats-grid">
                    <div className="detail-stat-item">
                      <span className="detail-label">Active</span>
                      <span className="detail-value active">{stats.students?.active || 0}</span>
                    </div>
                    <div className="detail-stat-item">
                      <span className="detail-label">Inactive</span>
                      <span className="detail-value inactive">{stats.students?.inactive || 0}</span>
                    </div>
                    <div className="detail-stat-item">
                      <span className="detail-label">Graduated</span>
                      <span className="detail-value graduated">{stats.students?.graduated || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-card">
                  <h3 className="detail-card-title">
                    <span className="detail-icon"></span> Staff
                  </h3>
                  <div className="detail-stats-grid">
                    <div className="detail-stat-item">
                      <span className="detail-label">Active</span>
                      <span className="detail-value active">{stats.faculty?.active || 0}</span>
                    </div>
                    <div className="detail-stat-item">
                      <span className="detail-label">Inactive</span>
                      <span className="detail-value inactive">{stats.faculty?.inactive || 0}</span>
                    </div>
                    <div className="detail-stat-item">
                      <span className="detail-label">Retired</span>
                      <span className="detail-value retired">{stats.faculty?.retired || 0}</span>
                    </div>
                  </div>
                </div>
                */}

                {/* Transport Details */}
                <div className="detail-card">
                  <h3 className="detail-card-title">
                    <span className="detail-icon"></span> Transport
                  </h3>
                  <div className="detail-stats-grid detail-stats-grid--2col">
                    <div className="detail-stat-item">
                      <span className="detail-label">Active</span>
                      <span className="detail-value active">{stats.transport?.active || 0}</span>
                    </div>
                    <div className="detail-stat-item">
                      <span className="detail-label">Under Maintenance</span>
                      <span className="detail-value maintenance">{stats.transport?.underMaintenance || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Announcements Details */}
                <div className="detail-card">
                  <h3 className="detail-card-title">
                    <span className="detail-icon"></span> Announcements
                  </h3>
                  <div className="detail-stats-grid">
                    <div className="detail-stat-item">
                      <span className="detail-label">Published</span>
                      <span className="detail-value published">{stats.announcements?.published || 0}</span>
                    </div>
                    <div className="detail-stat-item">
                      <span className="detail-label">Draft</span>
                      <span className="detail-value draft">{stats.announcements?.draft || 0}</span>
                    </div>
                    <div className="detail-stat-item">
                      <span className="detail-label">Scheduled</span>
                      <span className="detail-value scheduled">{stats.announcements?.scheduled || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerts Section */}
              {stats.alerts && stats.alerts.total > 0 && (
                <div className="alerts-card">
                  <h3 className="alerts-card-title">
                    <span className="alert-icon-badge"></span> Transport Alerts
                  </h3>
                  <div className="alerts-summary-grid">
                    <div className="alert-summary-card critical">
                      <div className="alert-summary-value">{stats.alerts.critical || 0}</div>
                      <div className="alert-summary-label">Critical (Expired)</div>
                    </div>
                    <div className="alert-summary-card urgent">
                      <div className="alert-summary-value">{stats.alerts.urgent || 0}</div>
                      <div className="alert-summary-label">Urgent (≤30 days)</div>
                    </div>
                    <div className="alert-summary-card info">
                      <div className="alert-summary-value">{stats.alerts.busesWithAlerts || 0}</div>
                      <div className="alert-summary-label">Buses with Alerts</div>
                    </div>
                  </div>
                  <button 
                    className="view-alerts-btn"
                    onClick={() => navigate('/admin/transport')}
                  >
                    View All Alerts →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

