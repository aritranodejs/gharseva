const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/subscriptions
 * @desc    Get logged in user's subscriptions
 * @access  Private
 */
router.get('/', protect, subscriptionController.getSubscriptions);

/**
 * @route   POST /api/subscriptions
 * @desc    Create a new subscription
 * @access  Private
 */
router.post('/', protect, subscriptionController.subscribe);

/**
 * @route   PUT /api/subscriptions/:id/status
 * @desc    Update subscription status
 * @access  Private
 */
router.put('/:id/status', protect, subscriptionController.updateStatus);

module.exports = router;
