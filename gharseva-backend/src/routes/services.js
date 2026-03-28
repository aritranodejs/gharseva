const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

/**
 * @route   GET /api/services
 * @desc    Get all active services
 * @access  Public
 */
router.get('/', serviceController.getServices);

/**
 * @route   POST /api/services
 * @desc    Create a new service (Admin)
 * @access  Admin (Mocked)
 */
router.post('/', serviceController.createService);

module.exports = router;
