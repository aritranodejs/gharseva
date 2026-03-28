const Service = require('../models/Service');
const Package = require('../models/Package');

class ServiceRepository {
  async findAll(query = {}) {
    return await Service.find(query);
  }

  async findById(id) {
    return await Service.findById(id);
  }

  async create(data) {
    return await Service.create(data);
  }

  // Packages
  async findAllPackages() {
    return await Package.find().populate('services');
  }

  async findPackageById(id) {
    return await Package.findById(id).populate('services');
  }
}

module.exports = new ServiceRepository();
