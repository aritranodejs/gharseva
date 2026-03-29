const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, protectAny } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/bookings
 * @desc    Create a new service booking
 * @access  Private
 */
router.post('/', protect, bookingController.create);

/**
 * @route   GET /api/bookings
 * @desc    Get bookings for the authenticated user
 * @access  Private
 */
router.get('/', protect, bookingController.getUserBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get details for a single booking
 * @access  Private
 */
router.get('/:id', protectAny, bookingController.getById);

/**
 * @route   PATCH /api/bookings/:id/cancel
 * @desc    User cancels their booking
 * @access  Private
 */
router.patch('/:id/cancel', protectAny, bookingController.cancel);

module.exports = router;
