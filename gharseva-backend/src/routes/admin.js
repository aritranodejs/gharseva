const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Middleware to restrict access to Admins only
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin only' });
    }
};

router.get('/stats', protect, adminOnly, adminController.getStats);
router.get('/settings', protect, adminOnly, adminController.getSettings);
router.patch('/settings', protect, adminOnly, adminController.updateSettings);
router.get('/export', protect, adminOnly, adminController.exportTransactions);
router.get('/bookings', protect, adminOnly, adminController.getAllBookings);

// Worker Management
router.get('/workers', protect, adminOnly, adminController.getWorkers);
router.patch('/workers/:id', protect, adminOnly, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'aadhaarImage', maxCount: 1 },
  { name: 'panImage', maxCount: 1 },
  { name: 'policeVerification', maxCount: 1 },
  { name: 'certification', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]), adminController.updateWorkerStatus);

module.exports = router;
