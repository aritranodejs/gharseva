const serviceRepository = require('../repositories/serviceRepository');

class ServiceService {
  async getAllServices(pincode = null, categoryId = null) {
    let query = { isActive: true };
    if (pincode) {
      query.$or = [
        { availablePincodes: pincode },
        { availablePincodes: { $size: 0 } },
        { availablePincodes: { $exists: false } }
      ];
    }
    if (categoryId) {
      query.category = categoryId;
    }
    return await serviceRepository.findAll(query);
  }

  async createService(data) {
    return await serviceRepository.create(data);
  }

  async getAllPackages() {
    return await serviceRepository.findAllPackages();
  }

  async getPackageDetails(id) {
    return await serviceRepository.findPackageById(id);
  }
}

module.exports = new ServiceService();
