# Fix MySQL Root Password Issue

## Problem
You're seeing: **"Access denied for user 'root'@'localhost' (using password: YES)"**

This means:
- ✅ The application is trying to use a password (good!)
- ❌ MySQL is rejecting the password (wrong password or permission issue)

## Solution Options

### Option 1: Verify Your MySQL Root Password

**Step 1: Test MySQL Password**
1. Open Command Prompt or PowerShell
2. Try to connect:
   ```bash
   mysql -u root -p
   ```
3. When prompted, enter: `root`
4. If it works → Password is correct, check `.env` file
5. If it fails → Password is wrong, use Option 2 or 3

**Step 2: Check Your .env File**
Make sure `EduGovern/edugovern-admin-server/.env` contains:
```env
DB_PASSWORD=root
```

---

### Option 2: Reset MySQL Root Password (XAMPP)

**Method A: Using XAMPP Shell**

1. Open **XAMPP Control Panel**
2. Click **"Shell"** button (opens command prompt)
3. Run:
   ```bash
   mysql -u root
   ```
4. If this works (no password), run:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
   FLUSH PRIVILEGES;
   EXIT;
   ```

**Method B: Using MySQL Workbench**

1. Open **MySQL Workbench**
2. Try to connect with:
   - Username: `root`
   - Password: (leave empty or try `root`)
3. If connected, run:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
   FLUSH PRIVILEGES;
   ```

---

### Option 3: Update .env with Correct Password

If your MySQL root password is **NOT** "root":

1. Find out your actual MySQL root password
2. Edit `EduGovern/edugovern-admin-server/.env`
3. Update the line:
   ```env
   DB_PASSWORD=your_actual_mysql_password
   ```
4. Save the file
5. Restart your server

---

### Option 4: Create New MySQL User (Alternative)

If you can't change root password, create a new user:

1. Connect to MySQL (using any method that works)
2. Run:
   ```sql
   CREATE USER 'edugovern'@'localhost' IDENTIFIED BY 'edugovern123';
   GRANT ALL PRIVILEGES ON edugovern.* TO 'edugovern'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. Update `.env`:
   ```env
   DB_USER=edugovern
   DB_PASSWORD=edugovern123
   ```

---

## Quick Fix Steps (Recommended)

### Step 1: Verify MySQL is Running
- XAMPP: MySQL should show "Running" status
- Port should be **3306**

### Step 2: Test MySQL Connection
```bash
mysql -u root -p
# Enter password when prompted
```

### Step 3: If Connection Works
- Your password is correct
- Check `.env` file has the same password
- Restart your Node.js server

### Step 4: If Connection Fails
- Try with empty password: `mysql -u root`
- If that works, set password to "root" (see Option 2)
- Or update `.env` with your actual password

### Step 5: Create Admin User
After MySQL connection works:
```bash
cd EduGovern/edugovern-admin-server
node database/seed-admin.js
```

---

## Verify Fix

After fixing the password:

1. **Restart your server:**
   ```bash
   cd EduGovern/edugovern-admin-server
   npm start
   ```

2. **You should see:**
   ```
   ✅ Environment variables loaded from: ...
   ✅ Database 'edugovern' verified/created
   ✅ Admins table verified/created
   ✅ MySQL database connected successfully
   🚀 Server running on http://localhost:5000
   ```

3. **Create admin user:**
   ```bash
   node database/seed-admin.js
   ```

4. **Login credentials:**
   - Admin ID: `ADMIN001`
   - Password: `admin123`

---

## Still Having Issues?

1. **Check MySQL Error Logs:**
   - XAMPP: Click "Logs" button next to MySQL
   - Look for authentication errors

2. **Check Windows Services:**
   - Make sure only ONE MySQL service is running
   - Multiple MySQL instances can cause conflicts

3. **Try Different Port:**
   - If port 3306 is in use, change MySQL port in XAMPP
   - Update `.env`: `DB_HOST=localhost:3307` (or your port)

4. **Firewall/Antivirus:**
   - Temporarily disable to test if it's blocking MySQL

