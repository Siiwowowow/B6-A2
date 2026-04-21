import { Router } from 'express';
import * as VehiclesController from './vehicles.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/',             VehiclesController.getAllVehicles);
router.get('/:vehicleId',   VehiclesController.getVehicleById);

// Admin-only routes
router.post('/',            authenticate, authorize('admin'), VehiclesController.createVehicle);
router.put('/:vehicleId',   authenticate, authorize('admin'), VehiclesController.updateVehicle);
router.delete('/:vehicleId',authenticate, authorize('admin'), VehiclesController.deleteVehicle);

export default router;