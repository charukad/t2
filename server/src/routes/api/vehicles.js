const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const vehiclesController = require('../../controllers/vehicles');
const { protect, authorize } = require('../../middleware/auth');
const validationMiddleware = require('../../middleware/validation');
const { uploadMultipleImages } = require('../../middleware/upload');

// Public routes
router.get('/search', vehiclesController.searchVehicles);

// Protected routes
router.use(protect);

// Route with parameters
router.get('/by-email/:email', vehiclesController.getVehiclesByEmail);
router.get('/my-vehicles', authorize('vehicleOwner'), vehiclesController.getMyVehicles);

// Get vehicle by ID (this should come after all specific routes to avoid conflicts)
router.get('/:id', vehiclesController.getVehicleById);

router.post(
  '/',
  [
    authorize('vehicleOwner'),
    (req, res, next) => {
      console.log('[POST /api/vehicles] Request body before validation:', JSON.stringify(req.body));
      console.log('[POST /api/vehicles] Data types: year=', typeof req.body.year, ', capacity.passengers=', typeof req.body.capacity?.passengers);
      next();
    },
    body('type').isIn(['car', 'van', 'suv', 'bus', 'motorcycle', 'tuk-tuk', 'bicycle', 'other']).withMessage('Invalid vehicle type'),
    body('make').notEmpty().withMessage('Vehicle make is required'),
    body('model').notEmpty().withMessage('Vehicle model is required'),
    body('year').isInt({ min: 1950, max: new Date().getFullYear() }).withMessage('Invalid year'),
    body('registrationNumber').notEmpty().withMessage('Registration number is required'),
    body('capacity.passengers').isInt({ min: 1 }).withMessage('Passenger capacity must be at least 1'),
    validationMiddleware
  ],
  vehiclesController.registerVehicle
);

router.put(
  '/:id',
  [
    authorize('vehicleOwner'),
    body('type').optional().isIn(['car', 'van', 'suv', 'bus', 'motorcycle', 'tuk-tuk', 'bicycle', 'other']).withMessage('Invalid vehicle type'),
    body('make').optional().notEmpty().withMessage('Vehicle make cannot be empty'),
    body('model').optional().notEmpty().withMessage('Vehicle model cannot be empty'),
    body('year').optional().isInt({ min: 1950, max: new Date().getFullYear() }).withMessage('Invalid year'),
    body('registrationNumber').optional().notEmpty().withMessage('Registration number cannot be empty'),
    body('capacity.passengers').optional().isInt({ min: 1 }).withMessage('Passenger capacity must be at least 1'),
    validationMiddleware
  ],
  vehiclesController.updateVehicle
);

router.delete('/:id', authorize('vehicleOwner'), vehiclesController.deleteVehicle);

router.post(
  '/:id/photos',
  authorize('vehicleOwner'),
  vehiclesController.uploadVehiclePhotos
);

router.post(
  '/:id/submit-verification',
  authorize('vehicleOwner'),
  vehiclesController.submitForVerification
);

module.exports = router;