import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/passwordReset.service.js';
import './ForgotPassword.css';

/**
 * Forgot Password Page
 * Allows admin to request password reset
 */
const ForgotPassword = () => {
  const [adminId, setAdminId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    setAdminId(e.target.value);
    if (error) setError('');
    if (success) setSuccess(false);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Validate input
    if (!adminId.trim()) {
      setError('Please enter your Admin ID');
      setLoading(false);
      return;
    }

    try {
      // Call forgot password service
      await forgotPassword(adminId.trim());
      setSuccess(true);
      setAdminId(''); // Clear input on success
    } catch (err) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>EduGovern</h1>
          <h2>Forgot Password</h2>
        </div>

        {success ? (
          <div className="success-message">
            <p>✅ If an account exists with this Admin ID, a password reset link has been sent.</p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Please check your email for the reset link. The link will expire in 15 minutes.
            </p>
            <Link to="/admin/login" className="back-to-login-link">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <p className="form-description">
              Enter your Admin ID and we'll send you a link to reset your password.
            </p>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="adminId">Admin ID</label>
              <input
                type="text"
                id="adminId"
                name="adminId"
                value={adminId}
                onChange={handleChange}
                placeholder="Enter your Admin ID"
                required
                autoComplete="username"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="back-to-login">
              <Link to="/admin/login" className="back-to-login-link">
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

