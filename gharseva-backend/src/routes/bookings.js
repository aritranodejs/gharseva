const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, protectWorker, protectAny } = require('../middleware/authMiddleware');

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

/**
 * @route   POST /api/bookings/:id/rebroadcast
 * @desc    Customer triggers a re-broadcast to find workers
 * @access  Private (User only)
 */
router.post('/:id/rebroadcast', protect, bookingController.rebroadcast);

const upload = require('../middleware/uploadMiddleware');

/**
 * @route   PATCH /api/bookings/:id/status
 * @desc    Worker updates booking status (with optional evidence photos)
 * @access  Private (Worker only)
 */
router.patch('/:id/status', protectWorker, upload.fields([
  { name: 'beforeServiceImages', maxCount: 5 },
  { name: 'afterServiceImages', maxCount: 5 }
]), bookingController.updateStatus);

/**
 * @route   PATCH /api/bookings/:id/worker-cancel
 * @desc    Worker cancels an assigned job
 * @access  Private (Worker only)
 */
router.patch('/:id/worker-cancel', protectWorker, bookingController.workerCancel);

module.exports = router;
