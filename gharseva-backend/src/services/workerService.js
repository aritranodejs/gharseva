const workerRepository = require('../repositories/workerRepository');
const { generateTokens } = require('../utils/auth');
const tokenStore = require('../utils/tokenStore');

class WorkerService {
  async authenticate(phoneNumber, password) {
    const cleanNumber = phoneNumber.replace(/^\+?91/, '').trim();
    const worker = await workerRepository.findByPhoneOrClean(phoneNumber, cleanNumber);
    
    if (!worker) throw new Error('Worker profile not found');
    
    const isMatch = await worker.matchPassword(password);
    if (!isMatch) throw new Error('Invalid credentials');

    if (worker.status === 'pending') {
      throw new Error('Your profile is pending admin approval.');
    }
    if (worker.status === 'rejected') {
      throw new Error('Your application was rejected by the admin.');
    }

    const tokens = generateTokens(worker._id, 'worker');
    await tokenStore.set(`rf_${tokens.refreshToken}`, worker._id.toString(), 7 * 24 * 60 * 60); // 7 days

    return {
      ...tokens,
      worker: {
        _id: worker._id,
        name: worker.name,
        phoneNumber: worker.phoneNumber,
        rating: worker.rating,
        skills: worker.skills
      }
    };
  }

  async getWorkerProfile(id) {
    const worker = await workerRepository.findById(id);
    if (!worker) throw new Error('Worker not found');
    return worker;
  }

  async registerWorker(data) {
    // Phone must be unique
    const existing = await workerRepository.findByPhoneOrClean(data.phoneNumber, data.phoneNumber);
    if (existing) {
      throw new Error('This phone number is already registered.');
    }
    
    // Save worker with status 'pending'
    return await workerRepository.create({
      ...data,
      status: 'pending'
    });
  }

  async updateWorkerProfile(id, updates) {
    const worker = await workerRepository.findById(id);
    if (!worker) throw new Error('Worker not found');

    if (updates.phoneNumber && updates.phoneNumber !== worker.phoneNumber) {
       const existing = await workerRepository.findByPhoneOrClean(updates.phoneNumber, updates.phoneNumber);
       if (existing) throw new Error('Phone number is already in use by another account');
       worker.phoneNumber = updates.phoneNumber;
    }

    if (updates.profilePicture) {
       worker.profilePicture = updates.profilePicture;
    }

    if (updates.categories) {
       worker.categories = typeof updates.categories === 'string' ? JSON.parse(updates.categories) : updates.categories;
    }

    if (updates.skills) {
       worker.skills = typeof updates.skills === 'string' ? JSON.parse(updates.skills) : updates.skills;
    }

    if (updates.aadhaarNumber) worker.aadhaarNumber = updates.aadhaarNumber;
    if (updates.panNumber) worker.panNumber = updates.panNumber;
    if (updates.aadhaarImage) worker.aadhaarImage = updates.aadhaarImage;
    if (updates.panImage) worker.panImage = updates.panImage;
    if (updates.policeVerification) worker.policeVerification = updates.policeVerification;
    if (updates.certification) worker.certification = updates.certification;

    await worker.save();
    return worker;
  }

  async setOnlineStatus(id, isOnline) {
    return await workerRepository.updateOnlineStatus(id, isOnline);
  }

  async updateLocation(id, coordinates) {
    return await workerRepository.updateLocation(id, coordinates);
  }

  async getWorkerEarnings(workerId, range = 'week', specificYear) {
    const mongoose = require('mongoose');
    const Booking = require('../models/Booking');
    
    let startDate;
    let endDate;
    let groupBy;

    const now = new Date();

    if (specificYear && specificYear !== 'all') {
      const targetYear = parseInt(specificYear);
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear + 1, 0, 1);
      groupBy = { $dateToString: { format: "%Y-%m", date: "$completedAt" } };
    } else {
      if (range === 'day') {
        startDate = new Date(new Date().setHours(0, 0, 0, 0));
        groupBy = { $hour: "$completedAt" };
      } else if (range === 'week') {
        startDate = new Date(new Date().setDate(now.getDate() - 7));
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } };
      } else if (range === 'month') {
        startDate = new Date(new Date().setMonth(now.getMonth() - 1));
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } };
      } else {
        startDate = new Date(new Date().setFullYear(now.getFullYear() - 1));
        groupBy = { $dateToString: { format: "%Y-%m", date: "$completedAt" } };
      }
    }

    const matchQuery = {
      assignedWorkerId: new mongoose.Types.ObjectId(workerId),
      status: 'completed',
      completedAt: { $gte: startDate, ...(endDate ? { $lt: endDate } : {}) }
    };

    const earningsData = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupBy,
          earnings: { $sum: "$workerEarnings" },
          volume: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const stats = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$workerEarnings" },
          totalJobs: { $sum: 1 }
        }
      }
    ]);

    const recentBookings = await Booking.find(matchQuery)
      .populate('serviceId', 'name')
      .sort({ completedAt: -1 })
      .limit(10);

    return {
      chartData: earningsData,
      totalEarnings: stats[0]?.totalEarnings || 0,
      totalJobs: stats[0]?.totalJobs || 0,
      recentBookings: recentBookings.map(b => ({
        bookingId: b.bookingId || b._id.toString().slice(-6),
        serviceName: b.serviceId?.name || 'Home Service',
        amount: b.workerEarnings || b.price,
        date: b.completedAt || b.updatedAt
      }))
    };
  }
}

module.exports = new WorkerService();
