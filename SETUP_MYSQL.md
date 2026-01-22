# How to Start MySQL for EduGovern

This guide shows you how to start MySQL using XAMPP or MySQL Workbench.

## Method 1: Using XAMPP (Recommended for Windows)

### Step 1: Open XAMPP Control Panel
1. Open the **XAMPP Control Panel** application
2. You should see a list of services including Apache, MySQL, FileZilla, etc.

### Step 2: Start MySQL
1. Find the **MySQL** row in the XAMPP Control Panel
2. Click the **"Start"** button next to MySQL
3. Wait for MySQL to start (the status will change to "Running")
4. You should see:
   - Green "Running" status
   - PID (Process ID) numbers
   - Port: **3306** (default MySQL port)

### Step 3: Verify MySQL is Running
- The MySQL row should show:
  - Status: **Running** (in green)
  - Port: **3306**
  - The "Stop" button should be active (not grayed out)

### Step 4: Check for Errors
- If MySQL fails to start, check the **Logs** section at the bottom
- Common issues:
  - Port 3306 already in use (another MySQL instance running)
  - MySQL service already running in Windows Services

### Troubleshooting XAMPP MySQL:
- **Port 3306 in use**: Stop other MySQL services or change XAMPP MySQL port
- **MySQL won't start**: Check Windows Event Viewer or XAMPP logs
- **Access denied**: Make sure you're using the correct username (root) and password

---

## Method 2: Using MySQL Workbench

### Step 1: Open MySQL Workbench
1. Launch **MySQL Workbench** from your applications
2. You should see a list of connections (usually "Local instance MySQL80" or similar)

### Step 2: Connect to MySQL Server
1. Click on your local MySQL connection (usually named "Local instance MySQL80")
2. Enter your password if prompted:
   - Username: **root**
   - Password: **root** (or your MySQL root password)
3. Click **OK** to connect

### Step 3: Verify Connection
- If connected successfully, you'll see:
  - The MySQL Workbench interface
  - A list of schemas (databases) on the left side
  - Query editor in the center

### Step 4: Check Server Status
1. In MySQL Workbench, go to **Server** → **Status and System Variables**
2. Or click on **Administration** tab
3. Verify that MySQL Server Status shows **"Running"**

### Note:
- MySQL Workbench is a **client tool** - it connects to MySQL but doesn't start it
- If MySQL Workbench can't connect, MySQL server might not be running
- You may need to start MySQL via XAMPP or Windows Services first

---

## Method 3: Using Windows Services (Alternative)

### Step 1: Open Services
1. Press **Windows + R** to open Run dialog
2. Type: `services.msc` and press Enter
3. This opens Windows Services Manager

### Step 2: Find MySQL Service
1. Scroll down to find **MySQL** or **MySQL80** service
2. The service name might be:
   - `MySQL`
   - `MySQL80`
   - `MySQL Server 8.0`

### Step 3: Start MySQL Service
1. Right-click on the MySQL service
2. Click **Start**
3. Wait for the service to start
4. Status should change to **"Running"**

---

## Verify MySQL is Running

### Quick Test:
1. Open Command Prompt or PowerShell
2. Run:
   ```bash
   mysql -u root -p
   ```
3. Enter password: **root**
4. If you see `mysql>` prompt, MySQL is running correctly!

### Or Test Connection from Node.js:
1. Start your EduGovern server:
   ```bash
   cd EduGovern/edugovern-admin-server
   npm start
   ```
2. You should see:
   ```
   ✅ Environment variables loaded from: ...
   ✅ Database 'edugovern' verified/created
   ✅ Admins table verified/created
   ✅ MySQL database connected successfully
   🚀 Server running on http://localhost:5000
   ```

---

## Common Issues and Solutions

### Issue 1: "Port 3306 already in use"
**Solution:**
- Another MySQL instance is running
- Stop other MySQL services or XAMPP MySQL
- Or change the port in your `.env` file

### Issue 2: "Access denied for user 'root'@'localhost'"
**Solution:**
- Check your `.env` file has correct password
- Verify MySQL root password is actually "root"
- Try resetting MySQL root password if needed

### Issue 3: "MySQL won't start in XAMPP"
**Solution:**
- Check XAMPP logs (click "Logs" button)
- Check Windows Event Viewer for errors
- Make sure port 3306 is not blocked by firewall
- Try running XAMPP as Administrator

### Issue 4: "Can't connect to MySQL server"
**Solution:**
- Verify MySQL service is actually running
- Check if MySQL is listening on port 3306
- Verify firewall isn't blocking the connection
- Check MySQL error logs

---

## Next Steps After MySQL is Running

1. **Start your backend server:**
   ```bash
   cd EduGovern/edugovern-admin-server
   npm start
   ```

2. **Create admin user (if not done already):**
   ```bash
   node database/seed-admin.js
   ```

3. **Start your frontend:**
   ```bash
   cd EduGovern/edugovern-admin-client
   npm run dev
   ```

4. **Access the application:**
   - Open browser: `http://localhost:5173`
   - Login with:
     - Admin ID: `ADMIN001`
     - Password: `admin123`

---

## Quick Reference

| Method | Best For | Difficulty |
|--------|----------|------------|
| XAMPP | Beginners, Quick setup | Easy |
| MySQL Workbench | Developers, Database management | Easy |
| Windows Services | System administrators | Medium |

**Recommended:** Use XAMPP for the easiest setup!

