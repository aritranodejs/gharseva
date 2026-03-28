const User = require('../models/User');

class UserRepository {
  async findByPhone(phoneNumber) {
    return await User.findOne({ phoneNumber });
  }

  async findById(id) {
    return await User.findById(id).select('-password');
  }

  async create(userData) {
    return await User.create(userData);
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true });
  }

  async addAddress(id, address) {
    return await User.findByIdAndUpdate(
      id,
      { $push: { addresses: address } },
      { new: true }
    );
  }

  async removeAddress(id, addressId) {
    return await User.findByIdAndUpdate(
      id,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    );
  }
}

module.exports = new UserRepository();
