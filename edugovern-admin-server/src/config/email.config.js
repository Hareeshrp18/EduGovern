import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Configuration
 * Configure nodemailer transporter for sending emails
 */

// Create transporter
// For development, using Gmail SMTP (configure in .env)
// For production, use proper SMTP service
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

/**
 * Send password reset email
 * @param {string} email - Admin email address
 * @param {string} resetLink - Password reset link with token
 * @returns {Promise<Object>} Email send result
 */
export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@edugovern.com',
      to: email,
      subject: 'EduGovern – Admin Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">EduGovern Admin Password Reset</h2>
          <p>Hello Admin,</p>
          <p>You have requested to reset your password. Click the link below to reset your password:</p>
          <p style="margin: 20px 0;">
            <a href="${resetLink}" 
               style="background-color: #667eea; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link in your browser:<br>
            <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 15 minutes.<br>
            If you did not request this password reset, please ignore this email.
          </p>
        </div>
      `,
      text: `
        EduGovern Admin Password Reset
        
        Hello Admin,
        
        You have requested to reset your password. Click the link below to reset your password:
        
        ${resetLink}
        
        This link will expire in 15 minutes.
        
        If you did not request this password reset, please ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send password reset email');
  }
};

export default transporter;

