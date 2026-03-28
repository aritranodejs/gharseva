const Worker = require('../models/Worker');

class WorkerRepository {
  async create(data) {
    return await Worker.create(data);
  }

  async findByPhone(phoneNumber) {
    return await Worker.findOne({ phoneNumber });
  }

  async findByPhoneOrClean(phoneNumber, cleanNumber) {
    return await Worker.findOne({
      $or: [
        { phoneNumber },
        { phoneNumber: cleanNumber }
      ]
    });
  }

  async findById(id) {
    return await Worker.findById(id).select('-password').populate('categories');
  }

  async updateLocation(id, coordinates) {
    return await Worker.findByIdAndUpdate(
      id,
      { location: { type: 'Point', coordinates } },
      { new: true }
    );
  }

  async updateOnlineStatus(id, isOnline) {
    return await Worker.findByIdAndUpdate(id, { isOnline }, { new: true });
  }

  async findNear(coordinates, maxDistance, query = {}) {
    return await Worker.find({
      ...query,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates },
          $maxDistance: maxDistance
        }
      }
    });
  }

  async findInPincodes(pincode, query = {}) {
    return await Worker.find({
      ...query,
      pincodes: pincode
    });
  }
}

module.exports = new WorkerRepository();
