const adminRepository = require('../repositories/adminRepository');
const { uploadFileBuffer } = require('./imageUpload');

class AdminService {
  async getDashboardStats(range, specificYear) {
    let startDate;
    let endDate;
    let groupBy;

    const now = new Date();

    if (specificYear && specificYear !== 'all') {
      const targetYear = parseInt(specificYear);
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear + 1, 0, 1);
      groupBy = { $dateToString: { format: "%Y-%m", date: { $ifNull: ["$completedAt", "$updatedAt"] } } };
    } else {
      if (range === 'day') {
        startDate = new Date(new Date().setHours(0, 0, 0, 0));
        groupBy = { $hour: { $ifNull: ["$completedAt", "$updatedAt"] } };
      } else if (range === 'week') {
        startDate = new Date(new Date().setDate(now.getDate() - 7));
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: { $ifNull: ["$completedAt", "$updatedAt"] } } };
      } else if (range === 'month') {
        startDate = new Date(new Date().setMonth(now.getMonth() - 1));
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: { $ifNull: ["$completedAt", "$updatedAt"] } } };
      } else {
        startDate = new Date(new Date().setFullYear(now.getFullYear() - 1));
        groupBy = { $dateToString: { format: "%Y-%m", date: { $ifNull: ["$completedAt", "$updatedAt"] } } };
      }
    }

    const dateMatch = {
      status: 'completed',
      $or: [
        { completedAt: { $gte: startDate, ...(endDate ? { $lt: endDate } : {}) } },
        { updatedAt: { $gte: startDate, ...(endDate ? { $lt: endDate } : {}) } }
      ]
    };

    const rangeMatch = {
      createdAt: { $gte: startDate, ...(endDate ? { $lt: endDate } : {}) }
    };


    const [totalBookings, completedBookings, activeWorkers, usersCount] = await Promise.all([
      adminRepository.countBookings(rangeMatch),
      adminRepository.countBookings({ ...dateMatch }),
      adminRepository.countWorkers({ status: 'approved' }),
      adminRepository.countUsers({ role: 'user' })
    ]);

    const recentBookings = await adminRepository.findBookings(
      { ...rangeMatch }, 
      [{ path: 'userId', select: 'name' }, { path: 'serviceId', select: 'name' }]
    );
    // Limit to 5 most recent for the dashboard
    const limitedRecent = recentBookings.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

    const rangeBookings = await adminRepository.findBookings(dateMatch, []);

    const totalRevenue = rangeBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const platformProfit = rangeBookings.reduce((sum, b) => sum + (b.platformFee || 0) + (b.commissionFee || 0), 0);
    const workerPayouts = rangeBookings.reduce((sum, b) => sum + (b.workerEarnings || 0), 0);

    const pipeline = [
      { $match: dateMatch },
      {
        $group: {
          _id: groupBy,
          revenue: { 
            $sum: { 
              $add: [
                { $ifNull: ["$platformFee", 0] }, 
                { $ifNull: ["$commissionFee", 0] }
              ] 
            } 
          },
          volume: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const chartData = await adminRepository.aggregateBookings(pipeline);

    // Distribution Data for Pie Chart (Revenue by Service)
    const piePipeline = [
      { $match: dateMatch },
      {
        $group: {
          _id: "$serviceId",
          revenue: { $sum: { $add: [{ $ifNull: ["$platformFee", 0] }, { $ifNull: ["$commissionFee", 0] }] } },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'services', // Standard pluralized collection name
          localField: '_id',
          foreignField: '_id',
          as: 'serviceInfo'
        }
      },
      {
        $unwind: { path: "$serviceInfo", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          name: { $ifNull: ["$serviceInfo.name", "Uncategorized"] },
          revenue: 1,
          count: 1
        }
      }
    ];

    const serviceDistribution = await adminRepository.aggregateBookings(piePipeline);

    return {
      totalBookings, // Now scoped to range
      completedBookings, // Now scoped to range
      activeWorkers,
      usersCount,
      totalRevenue,
      platformProfit,
      workerPayouts,
      recentBookings: limitedRecent,
      chartData,
      serviceDistribution
    };
  }

  async getSettings() {
    let settings = await adminRepository.getSettings();
    if (!settings) {
      settings = await adminRepository.createSettings({});
    }
    return settings;
  }

  async updateSettings(updates) {
    return await adminRepository.updateSettings(updates);
  }

  async exportTransactions() {
    return await adminRepository.findBookings({ status: 'completed' }, [
      { path: 'userId', select: 'name' },
      { path: 'assignedWorkerId', select: 'name' },
      { path: 'serviceId', select: 'name' }
    ]);
  }

  async getAllBookings(status, pincode, specificYear) {
    const query = {};
    if (status) query.status = status;
    if (pincode) query.pincode = pincode;
    
    if (specificYear && specificYear !== 'all') {
      const targetYear = parseInt(specificYear);
      const startDate = new Date(targetYear, 0, 1);
      const endDate = new Date(targetYear + 1, 0, 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    return await adminRepository.getAllBookingsSorted(query);
  }

  async getWorkers(status) {
    const query = status ? { status } : {};
    return await adminRepository.getWorkersSorted(query);
  }

  async deleteWorker(id) {
    const worker = await adminRepository.deleteWorker(id);
    if (!worker) throw new Error('Worker not found');
  }

  async getUsers() {
    return await adminRepository.getUsersSorted({ role: 'user' });
  }

  async deleteUser(id) {
    const user = await adminRepository.deleteUser(id);
    if (!user) throw new Error('Customer not found');
  }

  async updateUser(id, body, file) {
    const updates = { ...body };
    if (file) {
      updates.profilePicture = await uploadFileBuffer(file, 'uploads/profilePicture');
    }
    const user = await adminRepository.updateUser(id, updates);
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateWorkerStatus(id, body, files) {
    const updates = { ...body };
    if (body.status === 'approved') {
      updates.isActive = true;
    }
    if (files['profilePicture']) updates.profilePicture = await uploadFileBuffer(files['profilePicture'][0], 'uploads/profilePicture');
    if (files['aadhaarImage']) updates.aadhaarImage = await uploadFileBuffer(files['aadhaarImage'][0], 'uploads/aadhaarImage');
    if (files['panImage']) updates.panImage = await uploadFileBuffer(files['panImage'][0], 'uploads/panImage');
    if (files['policeVerification']) updates.policeVerification = await uploadFileBuffer(files['policeVerification'][0], 'uploads/policeVerification');
    if (files['certification']) updates.certification = await uploadFileBuffer(files['certification'][0], 'uploads/certification');

    const worker = await adminRepository.updateWorker(id, updates);
    if (!worker) throw new Error('Worker not found');
    return worker;
  }

  async assignWorker(bookingId, workerId) {
    const booking = await adminRepository.assignWorkerToBooking(bookingId, workerId);
    if (!booking) throw new Error('Booking not found');
    return booking;
  }
}

module.exports = new AdminService();
