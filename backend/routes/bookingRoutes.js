const express = require('express');
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  holdSeats
} = require('../controllers/bookingController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Hold seats before booking
router.post('/hold', holdSeats);

// Create booking
router.post('/', createBooking);

// Get user's bookings
router.get('/my', getMyBookings);

// Cancel booking
router.delete('/:id', cancelBooking);

// Admin only - get all bookings
router.get('/admin/all', adminMiddleware, getAllBookings);

module.exports = router;