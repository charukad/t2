const express = require('express');
const router = express.Router();

// Import API routes
const authRoutes = require('./api/auth');
const userRoutes = require('./api/users');
const touristRoutes = require('./api/tourists');
const guideRoutes = require('./api/guides');
const vehicleOwnersRoutes = require('./api/vehicleOwners');
const vehiclesRoutes = require('./api/vehicles');
const postsRoutes = require('./api/posts');
const eventsRoutes = require('./api/events');

// Use routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tourists', touristRoutes);
router.use('/guides', guideRoutes);
router.use('/vehicle-owners', vehicleOwnersRoutes);
router.use('/vehicles', vehiclesRoutes);
router.use('/posts', postsRoutes);
router.use('/events', eventsRoutes);

// API Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date(),
  });
});

module.exports = router;