# Quick Fix Guide - MySQL Connection & Login

## 🔴 Current Problem
**Error:** "Access denied for user 'root'@'localhost' (using password: YES)"

This means MySQL password is wrong or MySQL needs password reset.

---

## ✅ Solution Steps (Choose One)

### **Option A: Test if Password "root" Works**

1. **Open Command Prompt/PowerShell**
2. **Test MySQL connection:**
   ```bash
   mysql -u root -p
   ```
   Enter password: `root`
3. **If it works:**
   - Your `.env` file is correct
   - Just need to create admin user (see Step 3 below)
4. **If it fails:**
   - Try with empty password: `mysql -u root`
   - If that works, set password to "root" (see Option B)

---

### **Option B: Reset MySQL Password to "root"**

**Using XAMPP Shell:**
1. Open XAMPP Control Panel
2. Click **"Shell"** button
3. Run:
   ```bash
   mysql -u root
   ```
4. Then run:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
   FLUSH PRIVILEGES;
   EXIT;
   ```

**Using MySQL Workbench:**
1. Connect to MySQL (try with empty password first)
2. Run:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
   FLUSH PRIVILEGES;
   ```

---

### **Option C: Update .env with Your Actual Password**

If your MySQL root password is different:

1. **Edit:** `EduGovern/edugovern-admin-server/.env`
2. **Change:**
   ```env
   DB_PASSWORD=your_actual_password_here
   ```
3. **Save the file**

---

## 📝 Step-by-Step Fix

### Step 1: Fix MySQL Password
Follow Option A, B, or C above.

### Step 2: Verify .env File
Make sure `EduGovern/edugovern-admin-server/.env` exists and contains:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=edugovern
JWT_SECRET=edugovern_jwt_secret_key_2024_change_in_production
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Step 3: Restart Server
```bash
cd EduGovern/edugovern-admin-server
npm start
```

**You should see:**
```
✅ Environment variables loaded from: ...
✅ Database 'edugovern' verified/created
✅ Admins table verified/created
✅ MySQL database connected successfully
🚀 Server running on http://localhost:5000
```

### Step 4: Create Admin User
```bash
cd EduGovern/edugovern-admin-server
node database/seed-admin.js
```

**Expected output:**
```
✅ Admin created successfully
Admin ID: ADMIN001
Password: admin123
```

---

## 🔑 Login Credentials

After completing the steps above, use these to log in:

- **Admin ID:** `ADMIN001`
- **Password:** `admin123`

---

## 🚀 Start the Application

1. **Backend (Terminal 1):**
   ```bash
   cd EduGovern/edugovern-admin-server
   npm start
   ```

2. **Frontend (Terminal 2):**
   ```bash
   cd EduGovern/edugovern-admin-client
   npm run dev
   ```

3. **Open Browser:**
   - Go to: `http://localhost:5173`
   - Login with: `ADMIN001` / `admin123`

---

## ❓ Still Not Working?

1. **Check MySQL is running:**
   - XAMPP: MySQL status should be "Running"
   - Port: 3306

2. **Check .env file location:**
   - Must be in: `EduGovern/edugovern-admin-server/.env`
   - Not in `src/` folder

3. **Verify MySQL password:**
   ```bash
   mysql -u root -p
   # Enter your password
   ```

4. **Check for multiple MySQL instances:**
   - Only ONE MySQL should be running
   - Check Windows Services

---

## 📚 More Help

- **MySQL Setup:** See `SETUP_MYSQL.md`
- **Password Issues:** See `FIX_MYSQL_PASSWORD.md`
- **Login Credentials:** See `ADMIN_CREDENTIALS.md`

