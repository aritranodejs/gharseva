const workerRepository = require('../repositories/workerRepository');
const { generateTokens } = require('../utils/auth');

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
    const tokenStore = require('../utils/tokenStore');
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
}

module.exports = new WorkerService();
