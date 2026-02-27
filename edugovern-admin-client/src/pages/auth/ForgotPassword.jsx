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

          <h2>Forgot Password</h2>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

