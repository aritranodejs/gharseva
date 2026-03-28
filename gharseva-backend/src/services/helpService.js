const helpRepository = require('../repositories/helpRepository');

class HelpService {
  async getFaqs() {
    return await helpRepository.findAllFaqs();
  }

  async getPrivacyPolicy() {
    return {
      title: 'Privacy Policy',
      lastUpdated: 'March 2026',
      content: 'At GharSeva, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information when you use our home services platform... [Full Dynamic Policy Content]'
    };
  }
}

module.exports = new HelpService();
