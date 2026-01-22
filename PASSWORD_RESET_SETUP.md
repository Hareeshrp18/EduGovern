# Admin Password Reset Feature - Setup Guide

## ✅ Implementation Complete

The Admin Forgot Password & Reset Password feature has been implemented.

## 📋 What Was Implemented

### Backend
1. ✅ Database schema updated with `reset_token` and `reset_token_expiry` columns
2. ✅ Email service using nodemailer
3. ✅ Password reset service with secure token generation
4. ✅ API endpoints:
   - `POST /api/admin/forgot-password`
   - `POST /api/admin/reset-password`

### Frontend
1. ✅ Forgot Password page (`/admin/forgot-password`)
2. ✅ Reset Password page (`/admin/reset-password?token=XXX`)
3. ✅ "Forgot Password?" link on Login page

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
cd EduGovern/edugovern-admin-server
npm install
```

This will install `nodemailer` package.

### Step 2: Update Database

The database will automatically update when you restart the server (table is recreated).

**OR** if you have existing data, run the migration:

```bash
mysql -u root -p edugovern < database/add-reset-columns.sql
```

### Step 3: Configure Email (Optional for Demo)

For production, add email configuration to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@edugovern.com
ADMIN_EMAIL=admin@edugovern.com
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://support.google.com/accounts/answer/185833
3. Use the App Password in `SMTP_PASS`

**For Demo (No Email Setup):**
- If email is not configured, the reset link will be logged to console
- Check server console for the reset link when testing

### Step 4: Restart Server

```bash
npm start
```

The database table will be recreated with reset token columns.

### Step 5: Test the Feature

1. **Start Frontend:**
   ```bash
   cd EduGovern/edugovern-admin-client
   npm run dev
   ```

2. **Test Forgot Password:**
   - Go to login page
   - Click "Forgot Password?"
   - Enter Admin ID: `ADMIN001`
   - Submit
   - Check server console for reset link (if email not configured)

3. **Test Reset Password:**
   - Copy reset link from console
   - Open in browser
   - Enter new password
   - Submit
   - Should redirect to login page

## 🔐 Security Features

- ✅ Secure random token generation (crypto.randomBytes)
- ✅ Token expires in 15 minutes
- ✅ Single-use tokens (cleared after reset)
- ✅ Password hashed with bcrypt
- ✅ No user enumeration (same response for existing/non-existing users)
- ✅ Token validation before password reset

## 📝 API Endpoints

### POST /api/admin/forgot-password

**Request:**
```json
{
  "admin_id": "ADMIN001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this Admin ID, a password reset link has been sent."
}
```

### POST /api/admin/reset-password

**Request:**
```json
{
  "token": "abc123...",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

## 🎯 User Flow

1. Admin clicks "Forgot Password?" on login page
2. Enters Admin ID
3. Receives reset link (via email or console log for demo)
4. Clicks reset link
5. Enters new password
6. Password is reset
7. Redirected to login page

## 📧 Email Configuration

For production, configure SMTP in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@edugovern.com
```

## 🐛 Troubleshooting

### Email not sending?
- Check `.env` configuration
- For demo, check server console for reset link
- Verify SMTP credentials

### Token expired?
- Tokens expire in 15 minutes
- Request a new reset link

### Invalid token?
- Token may have been used already (single-use)
- Token may have expired
- Request a new reset link

## ✅ Ready for Demo!

The feature is fully implemented and ready to use. For demo purposes without email setup, the reset link will be displayed in the server console.

