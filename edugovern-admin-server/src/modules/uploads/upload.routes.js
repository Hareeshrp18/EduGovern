import express from 'express';
import multer from 'multer';
import { uploadFile } from './upload.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isCloudinaryConfigured } from '../../config/cloudinary.config.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // up to 20MB

// Protected route: POST /api/uploads
router.post('/', authenticate, upload.single('file'), uploadFile);

// GET /api/uploads/check - returns Cloudinary configuration status
router.get('/check', authenticate, (req, res) => {
  try {
    res.json({ success: true, data: { cloudinaryConfigured: isCloudinaryConfigured() } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get upload service status' });
  }
});

export default router;
