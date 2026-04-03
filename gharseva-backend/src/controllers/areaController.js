const ServiceableArea = require('../models/ServiceableArea');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Get all active serviceable areas
exports.getAreas = async (req, res) => {
  try {
    const areas = await ServiceableArea.find({ isActive: true });
    return sendSuccess(res, areas, 'Areas fetched successfully');
  } catch (error) {
    return sendError(res, 'Server Error', 500, error.message);
  }
};

// Add a new serviceable area
exports.addArea = async (req, res) => {
  try {
    const { cityName, pincodes, isActive } = req.body;
    const area = await ServiceableArea.create({ cityName, pincodes, isActive });
    return sendSuccess(res, area, 'Area created successfully', 201);
  } catch (error) {
    return sendError(res, 'Server Error', 500, error.message);
  }
};

// Update an existing serviceable area
exports.updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await ServiceableArea.findByIdAndUpdate(id, req.body, { new: true });
    if (!area) return sendError(res, 'Area not found', 404);
    return sendSuccess(res, area, 'Area updated successfully');
  } catch (error) {
    return sendError(res, 'Server Error', 500, error.message);
  }
};
