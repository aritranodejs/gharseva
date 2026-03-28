const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/send-otp
 * @desc    Mock sending an OTP
 * @access  Public
 */
router.post('/send-otp', userController.sendOtp);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and authenticate user
 * @access  Public
 */
router.post('/verify-otp', userController.verifyOtp);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', protect, userController.getProfile);

/**
 * @route   POST /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.post('/profile', protect, userController.updateProfile);

/**
 * @route   POST /api/auth/addresses
 * @desc    Add a new address
 * @access  Private
 */
router.post('/addresses', protect, userController.addAddress);

/**
 * @route   DELETE /api/auth/addresses/:id
 * @desc    Remove an address
 * @access  Private
 */
router.delete('/addresses/:id', protect, userController.removeAddress);

/**
 * @route   PUT /api/auth/addresses/:id
 * @desc    Update an existing address natively
 * @access  Private
 */
router.put('/addresses/:id', protect, userController.updateAddress);

module.exports = router;
