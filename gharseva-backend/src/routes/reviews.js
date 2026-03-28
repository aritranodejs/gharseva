const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/reviews/service/:serviceId
 * @desc    Get reviews for a specific service
 * @access  Public
 */
router.get('/service/:serviceId', reviewController.getReviews);

/**
 * @route   POST /api/reviews
 * @desc    Post a new review
 * @access  Private
 */
router.post('/', protect, reviewController.createReview);

module.exports = router;
