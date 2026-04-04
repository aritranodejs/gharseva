const userService = require('../services/userService');
const smsService = require('../services/smsService');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const tokenStore = require('../utils/tokenStore');
const { uploadFileBuffer } = require('../services/imageUpload');

class UserController {
  async sendOtp(req, res) {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return sendError(res, 'Phone number is required', 400);

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in tokenStore for 5 minutes
    await tokenStore.set(`otp_${phoneNumber}`, otp, 300);

    // Send via SMS Service (toggles between MOCK and REAL in .env)
    await smsService.sendOtp(phoneNumber, otp);

    sendSuccess(res, null, `OTP sent successfully.`);
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
      if (uploadFiles && uploadFiles['profilePicture'] && uploadFiles['profilePicture'].length > 0) {
        // Upload to standardized /uploads path
        updates.profilePicture = await uploadFileBuffer(uploadFiles['profilePicture'][0], '/uploads/profilePicture');
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
