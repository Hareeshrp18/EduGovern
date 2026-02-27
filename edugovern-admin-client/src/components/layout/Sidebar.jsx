import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { removeToken } from '../../utils/auth.js';

/* Sidebar Component Navigation menu for admin dashboard */
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 1, label: 'Dashboard', path: '/admin/dashboard' },
    { id: 2, label: 'Students', path: '/admin/students' },
    { id: 3, label: 'Teachers', path: '/admin/faculty' },
    { id: 4, label: 'Announcement', path: '/admin/announcements' },
    { id: 5, label: 'Transport', path: '/admin/transport' },
    { id: 6, label: 'Messages', path: '/admin/messages' },
    { id: 7, label: 'Request/ Approval', path: '/admin/requests' },
    { id: 8, label: 'Report Generate', path: '/admin/reports' },
    { id: 9, label: 'Academic Setup', path: '/admin/academic-setup' },
    { id: 10, label: 'Student Progress', path: '/admin/student-progress' },
    { id: 11, label: 'Logout', path: null }
  ];

  const handleMenuClick = (item) => {
    if (item.label === 'Logout') {
      // Clear auth token and redirect to login
      removeToken();
      navigate('/admin/login', { replace: true });
      return;
    }

    // Navigate for items that have a path defined
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>EduGovern</h2>
      </div>
      <nav className="sidebar-nav">
        <ul className="menu-list">
          {menuItems.map((item) => {
            const isActive = item.path && location.pathname === item.path;
            return (
            <li
              key={item.id}
                className={`menu-item ${isActive ? 'active' : ''}`}
              onClick={() => handleMenuClick(item)}
            >
              <span className="menu-label">{item.label}</span>
            </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

