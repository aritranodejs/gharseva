const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

/**
 * @route   GET /api/packages
 * @desc    Get all active packages
 * @access  Public
 */
router.get('/', serviceController.getPackages);

/**
 * @route   GET /api/packages/:id
 * @desc    Get single package details
 * @access  Public
 */
router.get('/:id', serviceController.getPackageDetails);

module.exports = router;
