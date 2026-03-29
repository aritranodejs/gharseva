const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const bookingController = require('../controllers/bookingController');
const { protectWorker } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * @route   POST /api/workers/register
 * @desc    Onboard a new worker with document uploads
 * @access  Public
 */
router.post('/register', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'aadhaarImage', maxCount: 1 },
  { name: 'panImage', maxCount: 1 },
  { name: 'policeVerification', maxCount: 1 },
  { name: 'certification', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]), workerController.register);

/**
 * @route   POST /api/workers/login
 * @desc    Authenticate a worker and return a JWT
 * @access  Public
 */
router.post('/login', workerController.login);

/**
 * @route   GET /api/workers/profile
 * @desc    Get authenticated worker profile
 * @access  Private (Worker)
 */
router.get('/profile', protectWorker, workerController.getProfile);

/**
 * @route   PUT /api/workers/profile
 * @desc    Update authenticated worker profile
 * @access  Private (Worker)
 */
router.put('/profile', protectWorker, upload.fields([{ name: 'profilePicture', maxCount: 1 }]), workerController.updateProfile);

/**
 * @route   GET /api/workers/bookings
 * @desc    Get bookings assigned to the authenticated worker
 * @access  Private (Worker)
 */
router.get('/bookings', protectWorker, bookingController.getWorkerBookings);

/**
 * @route   GET /api/workers/bookings/history
 * @desc    Get completed and cancelled bookings history
 * @access  Private (Worker)
 */
router.get('/bookings/history', protectWorker, bookingController.getWorkerHistory);

/**
 * @route   POST /api/workers/bookings/:id/accept
 * @desc    Worker accepts a broadcasted job request
 * @access  Private (Worker)
 */
router.post('/bookings/:id/accept', protectWorker, bookingController.acceptBooking);

/**
 * @route   POST /api/workers/bookings/:id/status
 * @desc    Worker updates job status (in_progress or completed)
 * @access  Private (Worker)
 */
router.post('/bookings/:id/status', protectWorker, bookingController.updateStatus);

/**
 * @route   POST /api/workers/online
 * @desc    Toggle online/offline status
 * @access  Private (Worker)
 */
router.post('/online', protectWorker, workerController.toggleOnline);

/**
 * @route   POST /api/workers/location
 * @desc    Update worker live location
 * @access  Private (Worker)
 */
router.post('/location', protectWorker, workerController.updateLocation);

/**
 * @route   PATCH /api/workers/bookings/:id/cancel
 * @desc    Worker cancels their assigned booking
 * @access  Private (Worker)
 */
router.patch('/bookings/:id/cancel', protectWorker, bookingController.cancel);

/**
 * @route   POST /api/workers/push-token
 * @desc    Save worker's Expo push token for remote notifications
 * @access  Private (Worker)
 */
router.post('/push-token', protectWorker, workerController.savePushToken);

module.exports = router;
