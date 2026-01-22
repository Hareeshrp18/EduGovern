import express from 'express';
import * as busController from './bus.controller.js';
import * as maintenanceController from './maintenance.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

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
router.post('/buses', busController.createBus);
router.put('/buses/:id', busController.updateBus);
router.delete('/buses/:id', busController.deleteBus);

export default router;
