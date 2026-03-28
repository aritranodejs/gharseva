const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protectAny } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for current user/worker
 * @access  Private
 */
router.get('/', protectAny, notificationController.getNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', protectAny, notificationController.markRead);

/**
 * @route   POST /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/read-all', protectAny, notificationController.markAllRead);

module.exports = router;
