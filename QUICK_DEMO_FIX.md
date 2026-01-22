# QUICK DEMO FIX - 2 Minutes

## Problem
Error: "Unknown column 'admin_id' in 'where clause'"

This means the database table structure is wrong or missing.

## FAST FIX (2 Steps)

### Step 1: Restart Server (This will recreate the table)
```bash
cd EduGovern/edugovern-admin-server
npm start
```

Wait for:
```
✅ Database 'edugovern' verified/created
✅ Admins table created successfully
✅ MySQL database connected successfully
```

### Step 2: Create Admin User
```bash
node database/quick-seed.js
```

You'll see:
```
✅ Admin created successfully!
📋 LOGIN CREDENTIALS:
   Admin ID: ADMIN001
   Password: admin123
```

## LOGIN
- **Admin ID:** `ADMIN001`
- **Password:** `admin123`

## If Step 1 Fails

### Manual Fix via MySQL:

1. **Connect to MySQL:**
   ```bash
   mysql -u root -p
   ```
   Password: `root`

2. **Run these commands:**
   ```sql
   USE edugovern;
   DROP TABLE IF EXISTS admins;
   CREATE TABLE admins (
     id INT PRIMARY KEY AUTO_INCREMENT,
     admin_id VARCHAR(50) UNIQUE NOT NULL,
     name VARCHAR(100) NOT NULL,
     password VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   EXIT;
   ```

3. **Then run:**
   ```bash
   node database/quick-seed.js
   ```

## DONE! Ready for Demo

