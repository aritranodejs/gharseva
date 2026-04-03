const serviceService = require('../services/serviceService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class ServiceController {
  async getServices(req, res) {
    const { pincode, categoryId } = req.query;
    try {
      const services = await serviceService.getAllServices(pincode, categoryId);
      sendSuccess(res, services);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async createService(req, res) {
    try {
      const service = await serviceService.createService(req.body);
      sendSuccess(res, service, 'Service created successfully', 201);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async getPackages(req, res) {
    try {
      const packages = await serviceService.getAllPackages();
      sendSuccess(res, packages);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async getPackageDetails(req, res) {
    try {
      const pkg = await serviceService.getPackageDetails(req.params.id);
      if (!pkg) return sendError(res, 'Package not found', 404);
      sendSuccess(res, pkg);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async updateService(req, res) {
    try {
      const service = await serviceService.updateService(req.params.id, req.body);
      if (!service) return sendError(res, 'Service not found', 404);
      sendSuccess(res, service, 'Service updated successfully');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async deleteService(req, res) {
    try {
      const service = await serviceService.deleteService(req.params.id);
      if (!service) return sendError(res, 'Service not found', 404);
      sendSuccess(res, null, 'Service deleted successfully');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }
}

module.exports = new ServiceController();
