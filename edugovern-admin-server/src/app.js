import express from 'express';
import cors from 'cors';
import adminRoutes from './modules/admin/admin.routes.js';
import studentRoutes from './modules/students/student.routes.js';
import announcementRoutes from './modules/announcements/announcement.routes.js';
import facultyRoutes from './modules/faculty/faculty.routes.js';
import transportRoutes from './modules/transport/bus.routes.js';
import messageRoutes from './modules/messages/message.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Note: dotenv is loaded in server.js before this module is imported

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Health check endpoint
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
app.use('/api/admin/reports', reportRoutes);

// 404 Handler
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

export default app;

