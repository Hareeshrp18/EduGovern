# EduGovern - Admin Application

EduGovern is a web-based academic and transport management system. This repository contains the **Admin Application** only.

## Project Structure

```
EduGovern/
├── edugovern-admin-server/    # Backend (Node.js + Express + MySQL)
└── edugovern-admin-client/    # Frontend (React + Vite)
```

## Tech Stack

### Backend
- Node.js
- Express.js
- MySQL (mysql2)
- JWT (jsonwebtoken)
- bcrypt (password hashing)

### Frontend
- React 18
- Vite
- React Router DOM
- Axios

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher) - **Must be running before starting the server**
- npm or yarn

### Starting MySQL

**Before running the application, make sure MySQL is running!**

See [SETUP_MYSQL.md](SETUP_MYSQL.md) for detailed instructions on how to start MySQL using:
- XAMPP (Recommended for Windows)
- MySQL Workbench
- Windows Services

**Quick Start (XAMPP):**
1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. Wait for status to show "Running" on port 3306

## Setup Instructions

### 1. Database Setup

**Option 1: Automatic Setup (Recommended)**
The application will automatically create the database and table when you start the server for the first time. Just make sure MySQL is running.

**Option 2: Manual Setup**
1. Start your MySQL server (via XAMPP, MySQL Workbench, or command line)
2. Create the database and table manually:

```bash
# Using MySQL command line
mysql -u root -p < edugovern-admin-server/database/create-database.sql

# Or using MySQL Workbench:
# Open MySQL Workbench, connect to your server, and run:
# edugovern-admin-server/database/create-database.sql
```

3. Seed a test admin user:

```bash
cd edugovern-admin-server
npm install
node database/seed-admin.js
```

**Note:** The database will be created automatically on first server start if it doesn't exist.

**Admin Login Credentials:**
- **Admin ID:** `ADMIN001`
- **Password:** `admin123`

**MySQL Database Credentials:**
- **Username:** `root`
- **Password:** `root`

### 2. Backend Setup

```bash
cd edugovern-admin-server
npm install
```

Create a `.env` file in `edugovern-admin-server/`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=edugovern
JWT_SECRET=your_jwt_secret_key_change_this_in_production
PORT=5000
FRONTEND_URL=http://localhost:5173
```

**Note:** Update `DB_PASSWORD` if your MySQL password is different.

Start the backend server:

```bash
npm start
# or for development with auto-reload
npm run dev
```

The server will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd edugovern-admin-client
npm install
```

Create a `.env` file in `edugovern-admin-client/`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. You will be redirected to the login page
3. Use the test credentials:
   - Admin ID: `ADMIN001`
   - Password: `admin123`
4. After successful login, you will be redirected to the admin dashboard

## API Endpoints

### Authentication

- `POST /api/admin/login`
  - Body: `{ "admin_id": "ADMIN001", "password": "admin123" }`
  - Response: `{ "success": true, "data": { "token": "...", "admin": {...} } }`

### File uploads

- `POST /api/uploads` (Protected: requires admin JWT)
  - Multipart form-data: field `file` (file to upload), optional `folder` (e.g., `students`, `staff`, `buses`, `messages`)
  - Response: `{ "success": true, "data": { "url": "https://...", "public_id": "...", "resource_type": "image|raw", "size": 12345, "name": "file.png", "type": "image/png" } }`
  - Notes: Files are uploaded to Cloudinary when Cloudinary credentials are present in `.env`. Allowed file types include common images and documents; max size is 20MB by default.

## Project Features (Current Scope)

✅ Admin Login (Admin ID + Password)
✅ JWT Authentication
✅ Protected Dashboard Route
✅ Basic Dashboard UI with Sidebar and Header
✅ Role-based access control (Admin only)

## Future Features (Not in Current Scope)

- Staff/Student/Transport Manager applications
- CRUD operations for students, teachers, etc.
- Announcements management
- Transport management
- Reports and analytics
- Chat system
- Feedback system

## Notes

- This is the **Admin Application** only
- The system is designed to have separate applications for Admin, Staff, Student, and Transport Manager
- Only basic authentication and dashboard UI are implemented in this phase
- All passwords are hashed using bcrypt (10 salt rounds)
- JWT tokens expire after 1 hour
- File uploads (student/staff images, transport bus images, and message attachments such as PNG/PDF) are uploaded to Cloudinary when `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set in the backend `.env`. For convenience, the server also supports legacy names `CLOUD_NAME`, `CLOUD_API_KEY`, and `CLOUD_API_SECRET`.
- Local serving of `/uploads` is disabled by default; set `ALLOW_LOCAL_UPLOADS=true` to enable local file storage (not recommended for production).

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `.env` file has correct database credentials
- Ensure database `edugovern` exists

### CORS Issues
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Default frontend URL: `http://localhost:5173`

### Authentication Issues
- Ensure JWT_SECRET is set in backend `.env`
- Check that token is being stored in localStorage
- Verify token is sent in Authorization header as `Bearer <token>`

## License

ISC

