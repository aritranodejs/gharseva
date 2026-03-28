const PaymentMethod = require('../models/PaymentMethod');

class PaymentRepository {
  async findByUserId(userId) {
    return await PaymentMethod.find({ userId });
  }

  async findByIdentifier(userId, identifier) {
    return await PaymentMethod.findOne({ userId, identifier });
  }

  async create(data) {
    return await PaymentMethod.create(data);
  }

  async deleteById(id, userId) {
    return await PaymentMethod.findOneAndDelete({ _id: id, userId });
  }
}

module.exports = new PaymentRepository();
