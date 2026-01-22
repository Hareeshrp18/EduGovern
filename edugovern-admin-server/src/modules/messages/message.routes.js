import express from 'express';
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import * as messageController from './message.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Multer setup for attachments
const uploadDir = path.join(process.cwd(), 'uploads', 'messages');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type'));
    }
    cb(null, true);
  }
});

// All routes require authentication
router.use(authenticate);

// Message routes
router.get('/', messageController.getAllMessages);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/:id', messageController.getMessageById);
router.post('/', upload.single('attachment'), messageController.createMessage);
router.put('/:id/read', messageController.markMessageAsRead);
router.put('/read-multiple', messageController.markMessagesAsRead);
router.delete('/:id', messageController.deleteMessage);

export default router;
