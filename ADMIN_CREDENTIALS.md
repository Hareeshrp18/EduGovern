# EduGovern Admin Login Credentials

## Default Admin Account

After running the seed script, use these credentials to log in:

### Login Credentials:
- **Admin ID:** `ADMIN001`
- **Password:** `admin123`

---

## How to Create Admin User

### Step 1: Make sure MySQL is connected
Your server should show:
```
✅ MySQL database connected successfully
```

### Step 2: Run the seed script
```bash
cd EduGovern/edugovern-admin-server
node database/seed-admin.js
```

### Step 3: Expected Output
You should see:
```
✅ Admin created successfully
Admin ID: ADMIN001
Password: admin123
```

Or if admin already exists:
```
✅ Admin password updated successfully
Admin ID: ADMIN001
Password: admin123
```

---

## Login Steps

1. **Start Backend Server:**
   ```bash
   cd EduGovern/edugovern-admin-server
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd EduGovern/edugovern-admin-client
   npm run dev
   ```

3. **Open Browser:**
   - Go to: `http://localhost:5173`
   - You'll be redirected to login page

4. **Enter Credentials:**
   - Admin ID: `ADMIN001`
   - Password: `admin123`

5. **Click Login**
   - On success, you'll be redirected to the dashboard

---

## Troubleshooting Login

### Issue: "Invalid admin ID or password"
**Solution:**
- Make sure you ran `node database/seed-admin.js`
- Verify admin exists in database:
  ```sql
  SELECT * FROM edugovern.admins;
  ```

### Issue: "Database error"
**Solution:**
- Check MySQL is running
- Verify MySQL credentials in `.env` file
- See `FIX_MYSQL_PASSWORD.md` for help

### Issue: Can't connect to server
**Solution:**
- Make sure backend is running on port 5000
- Check frontend `.env` has: `VITE_API_URL=http://localhost:5000`

---

## Security Note

⚠️ **These are default test credentials!**

For production:
1. Change the admin password
2. Use strong, unique passwords
3. Consider implementing password policies
4. Enable additional security measures

