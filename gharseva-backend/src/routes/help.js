const express = require('express');
const router = express.Router();
const helpController = require('../controllers/helpController');

/**
 * @route   GET /api/help/faqs
 * @desc    Get all dynamic FAQs
 * @access  Public
 */
router.get('/faqs', helpController.getFaqs);

/**
 * @route   GET /api/help/privacy
 * @desc    Get Privacy Policy (Dynamic)
 * @access  Public
 */
router.get('/privacy', helpController.getPrivacy);

module.exports = router;
