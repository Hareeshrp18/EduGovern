import express from 'express';
import cors from 'cors';
import adminRoutes from './modules/admin/admin.routes.js';
import studentRoutes from './modules/students/student.routes.js';
import announcementRoutes from './modules/announcements/announcement.routes.js';
import facultyRoutes from './modules/faculty/faculty.routes.js';
import transportRoutes from './modules/transport/bus.routes.js';
import messageRoutes from './modules/messages/message.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import requestRoutes from './modules/requests/request.routes.js';
import academicRoutes from './modules/academic/academic.routes.js';
import uploadRoutes from './modules/uploads/upload.routes.js';
import marksRoutes from './modules/marks/marks.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';


const app = express();

// CORS: allow admin (5173), staff/student (5174), and optional env origins
const allowedOrigins = [
  'http://localhost:5173', // admin
  'http://localhost:5174'  // staff / student
];
if (process.env.FRONTEND_URL) {
  const u = process.env.FRONTEND_URL.replace(/\/$/, '');
  if (u && !allowedOrigins.includes(u)) allowedOrigins.push(u);
}
if (process.env.CORS_ORIGINS) {
  process.env.CORS_ORIGINS.split(',').forEach(s => {
    const u = s.trim();
    if (u && !allowedOrigins.includes(u)) allowedOrigins.push(u);
  });
}

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, origin);
    return cb(null, false);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.ALLOW_LOCAL_UPLOADS === 'true') {
  app.use('/uploads', express.static('uploads'));
} else {
  console.log(' Local uploads disabled; using Cloudinary for file storage. Set ALLOW_LOCAL_UPLOADS=true to enable local serving.');
} 

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/admin/requests', requestRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/marks', marksRoutes);

app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

export default app;

