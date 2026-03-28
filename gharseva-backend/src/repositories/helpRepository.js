const FAQ = require('../models/FAQ');

class HelpRepository {
  async findAllFaqs() {
    return await FAQ.find({ isActive: true });
  }
}

module.exports = new HelpRepository();
