const userService = require('../services/userService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class UserController {
  async sendOtp(req, res) {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return sendError(res, 'Phone number is required', 400);
    // Mock sending OTP
    sendSuccess(res, null, 'OTP sent successfully (mock: 123456)');
  }

  async verifyOtp(req, res) {
    const { phoneNumber, otp } = req.body;
    try {
      const data = await userService.verifyOtp(phoneNumber, otp);
      sendSuccess(res, data, 'Login successful');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async getProfile(req, res) {
    try {
      const user = await userService.getProfile(req.user.id);
      sendSuccess(res, user);
    } catch (err) {
      sendError(res, err.message, 404);
    }
  }

  async updateProfile(req, res) {
    try {
      const uploadFiles = req.files || {};
      const updates = { ...req.body };
      if (uploadFiles['profilePicture']) {
         updates.profilePicture = `/uploads/${uploadFiles['profilePicture'][0].filename}`;
      }
      const user = await userService.updateProfile(req.user.id, updates);
      sendSuccess(res, user, 'Profile updated successfully');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async addAddress(req, res) {
    try {
      const user = await userService.addAddress(req.user.id, req.body);
      sendSuccess(res, user.addresses, 'Address added successfully', 201);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async updateAddress(req, res) {
    try {
      const user = await userService.updateAddress(req.user.id, req.params.id, req.body);
      sendSuccess(res, user.addresses, 'Address updated successfully');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async removeAddress(req, res) {
    try {
      const user = await userService.removeAddress(req.user.id, req.params.id);
      sendSuccess(res, user.addresses, 'Address removed successfully');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }
}

module.exports = new UserController();
