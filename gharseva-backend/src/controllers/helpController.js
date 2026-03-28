const helpService = require('../services/helpService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class HelpController {
  async getFaqs(req, res) {
    try {
      const faqs = await helpService.getFaqs();
      sendSuccess(res, faqs);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async getPrivacy(req, res) {
    try {
      const policy = await helpService.getPrivacyPolicy();
      sendSuccess(res, policy);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }
}

module.exports = new HelpController();
