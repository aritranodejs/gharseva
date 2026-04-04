const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * @route   GET /api/public/settings
 * @desc    Get public platform settings (Premium/Luxury status)
 * @access  Public
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne() || {};
    // Return only active public fields
    const publicSettings = {
      platformFeeType: settings.platformFeeType || 'fixed',
      platformFeeValue: settings.platformFeeValue || 0,
      isPremiumEnabled: settings.isPremiumEnabled || false,
      isLuxuryEnabled: settings.isLuxuryEnabled || false,
      acceptCOD: settings.acceptCOD !== undefined ? settings.acceptCOD : true,
      acceptUPI: settings.acceptUPI !== undefined ? settings.acceptUPI : true,
      razorpayEnabled: settings.razorpayEnabled || false,
      workerCommissionPercentage: settings.workerCommissionPercentage || 10,
      minJobsForCommission: settings.minJobsForCommission || 10
    };
    sendSuccess(res, publicSettings);
  } catch (error) {
    sendError(res, error.message, 500);
  }
});

module.exports = router;
