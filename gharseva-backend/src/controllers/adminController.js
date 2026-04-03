const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const Worker = require('../models/Worker');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class AdminController {
    /**
     * Get Dashboard Stats
     */
    async getStats(req, res) {
        try {
            const totalBookings = await Booking.countDocuments();
            const completedBookings = await Booking.countDocuments({ status: 'completed' });
            
            // Calculate Total Revenue (Platform Fees from completed bookings)
            const revenueResult = await Booking.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, totalRevenue: { $sum: '$platformFee' } } }
            ]);
            const totalRevenue = revenueResult[0]?.totalRevenue || 0;

            // Daily Income (last 24h)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const dailyRevenueResult = await Booking.aggregate([
                { $match: { status: 'completed', completedAt: { $gte: oneDayAgo } } },
                { $group: { _id: null, dailyRevenue: { $sum: '$platformFee' } } }
            ]);
            const dailyRevenue = dailyRevenueResult[0]?.dailyRevenue || 0;

            // Time-series stats for Charts
            // 1. Last 7 Days (Daily)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const weeklyStats = await Booking.aggregate([
                { $match: { status: 'completed', completedAt: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
                        revenue: { $sum: "$platformFee" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            // 2. Last 12 Months (Monthly)
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
            twelveMonthsAgo.setDate(1);
            const yearlyStats = await Booking.aggregate([
                { $match: { status: 'completed', completedAt: { $gte: twelveMonthsAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$completedAt" } },
                        revenue: { $sum: "$platformFee" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            sendSuccess(res, {
                totalBookings,
                completedBookings,
                totalRevenue,
                dailyRevenue,
                charts: {
                    weekly: weeklyStats,
                    yearly: yearlyStats
                }
            });
        } catch (error) {
            sendError(res, error.message, 500);
        }
    }

    /**
     * Export Transactions
     */
    async exportTransactions(req, res) {
        try {
            const bookings = await Booking.find({ status: 'completed' })
                 .populate('userId', 'name phoneNumber')
                 .populate('assignedWorkerId', 'name')
                 .populate('serviceId', 'name')
                 .sort({ completedAt: -1 });
            
            // Return raw data for frontend to convert to Excel/PDF
            sendSuccess(res, bookings);
        } catch (error) {
            sendError(res, error.message, 500);
        }
    }

    /**
     * Get Platform Fee Settings
     */
    async getSettings(req, res) {
        try {
            const settings = await Settings.findOne() || await Settings.create({});
            sendSuccess(res, settings);
        } catch (error) {
            sendError(res, error.message, 500);
        }
    }

    /**
     * Update Platform Fee Settings
     */
    async updateSettings(req, res) {
        try {
            const { 
                isPremiumEnabled, isLuxuryEnabled,
                platformFeeType, platformFeeValue,
                workerCommissionPercentage,
                minJobsForCommission
            } = req.body;
            
            let settings = await Settings.findOne();
            if (!settings) settings = new Settings();

            // Handle the active fields
            if (isPremiumEnabled !== undefined) settings.isPremiumEnabled = isPremiumEnabled;
            if (isLuxuryEnabled !== undefined) settings.isLuxuryEnabled = isLuxuryEnabled;
            if (platformFeeType !== undefined) settings.platformFeeType = platformFeeType;
            if (platformFeeValue !== undefined) settings.platformFeeValue = Number(platformFeeValue);
            if (workerCommissionPercentage !== undefined) settings.workerCommissionPercentage = Number(workerCommissionPercentage);
            if (minJobsForCommission !== undefined) settings.minJobsForCommission = Number(minJobsForCommission);

            await settings.save();
            sendSuccess(res, settings, 'Settings updated successfully');
        } catch (error) {
            sendError(res, error.message, 500);
        }
    }

    /**
     * Get All Workers
     */
    async getWorkers(req, res) {
        try {
            const workers = await Worker.find().sort({ createdAt: -1 });
            sendSuccess(res, workers);
        } catch (error) {
            sendError(res, error.message, 500);
        }
    }

    /**
     * Update Worker Profile/Status
     */
    async updateWorkerStatus(req, res) {
        try {
            const uploadFiles = req.files || {};
            const updates = { ...req.body };
            
            if (uploadFiles['aadhaarImage']) updates.aadhaarImage = `/uploads/aadhaarImage/${uploadFiles['aadhaarImage'][0].filename}`;
            if (uploadFiles['panImage']) updates.panImage = `/uploads/panImage/${uploadFiles['panImage'][0].filename}`;
            if (uploadFiles['policeVerification']) updates.policeVerification = `/uploads/policeVerification/${uploadFiles['policeVerification'][0].filename}`;
            if (uploadFiles['certification']) updates.certification = `/uploads/certification/${uploadFiles['certification'][0].filename}`;
            
            if (uploadFiles['documents']) {
                const existing = updates.existingDocuments ? JSON.parse(updates.existingDocuments) : [];
                const newDocs = uploadFiles['documents'].map(d => `/uploads/documents/${d.filename}`);
                updates.documents = [...existing, ...newDocs];
            }
            
            const worker = await Worker.findByIdAndUpdate(req.params.id, updates, { new: true });
            if (!worker) return sendError(res, 'Worker not found', 404);
            sendSuccess(res, worker, 'Worker status updated');
        } catch (error) {
            sendError(res, error.message, 500);
        }
    }

    /**
     * Get All Bookings (Platform Wide)
     */
    async getAllBookings(req, res) {
        try {
            const bookings = await Booking.find()
                .populate('userId', 'name phoneNumber')
                .populate('assignedWorkerId', 'name')
                .populate('serviceId', 'name')
                .sort({ createdAt: -1 }); // Most recent first
            sendSuccess(res, bookings);
        } catch (error) {
            sendError(res, error.message, 500);
        }
    }
}

module.exports = new AdminController();
