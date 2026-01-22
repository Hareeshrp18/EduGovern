import './Header.css';

/*Header Component Displays the dashboard header*/
const Header = () => {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        <h1 className="header-title">Admin Dashboard</h1>
        <div className="header-actions">
          <span className="admin-name">Welcome, Admin</span>
        </div>
      </div>
    </header>
  );
};

export default Header;

