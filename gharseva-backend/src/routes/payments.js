const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a Razorpay order
 * @access  Private
 */
router.post('/create-order', protect, paymentController.createOrder);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment
 * @access  Private
 */
router.post('/verify', protect, paymentController.verifyPayment);

/**
 * @route   GET /api/payments/methods
 * @desc    Get all saved payment methods for a user
 * @access  Private
 */
router.get('/methods', protect, paymentController.getMethods);

/**
 * @route   POST /api/payments/methods
 * @desc    Add a new payment method
 * @access  Private
 */
router.post('/methods', protect, paymentController.addMethod);

/**
 * @route   DELETE /api/payments/methods/:id
 * @desc    Delete a payment method
 * @access  Private
 */
router.delete('/methods/:id', protect, paymentController.removeMethod);

/**
 * @route   POST /api/payments/verify-upi
 * @desc    Verify UPI ID using simulated Banking Network
 * @access  Private
 */
router.post('/verify-upi', protect, paymentController.verifyUpi);

module.exports = router;

