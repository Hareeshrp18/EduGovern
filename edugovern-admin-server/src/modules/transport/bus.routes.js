import express from 'express';
import multer from 'multer';
import * as busController from './bus.controller.js';
import * as maintenanceController from './maintenance.controller.js';
import * as uploadController from './bus.upload.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Multer setup for bus images (memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// Debug: Verify maintenance controller is loaded
console.log('Maintenance routes loaded:', {
  getBusMaintenance: typeof maintenanceController.getBusMaintenance,
  createMaintenanceRecord: typeof maintenanceController.createMaintenanceRecord
});

// Maintenance routes (must come before /buses/:id to avoid route conflicts)
router.get('/maintenance/bus/:busId', maintenanceController.getBusMaintenance);
router.get('/maintenance/:id', maintenanceController.getMaintenanceRecord);
router.post('/maintenance', maintenanceController.createMaintenanceRecord);
router.put('/maintenance/:id', maintenanceController.updateMaintenanceRecord);
router.delete('/maintenance/:id', maintenanceController.deleteMaintenanceRecord);

// Bus routes
router.get('/buses', busController.getAllBuses);
router.get('/buses/alerts', busController.getBusesWithExpiringDocuments);
router.get('/buses/:id', busController.getBusById);
router.post('/buses/upload-images', upload.array('images', 10), uploadController.uploadBusImages);
router.post('/buses', busController.createBus);
router.put('/buses/:id', busController.updateBus);
router.delete('/buses/:id', busController.deleteBus);

export default router;
