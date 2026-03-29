const userRepository = require('../repositories/userRepository');
const { generateTokens } = require('../utils/auth');
const { uploadImage } = require('../services/imageUpload');

class UserService {
  async verifyOtp(phoneNumber, otp) {
    if (otp !== '123456') throw new Error('Invalid OTP');

    let user = await userRepository.findByPhone(phoneNumber);
    if (!user) {
      user = await userRepository.create({ phoneNumber, isVerified: true });
    }

    const tokens = generateTokens(user._id, 'user');
    const tokenStore = require('../utils/tokenStore');
    await tokenStore.set(`rf_${tokens.refreshToken}`, user._id.toString(), 7 * 24 * 60 * 60); // 7 days

    return {
      _id: user._id,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
      ...tokens,
    };
  }

  async getProfile(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateProfile(id, updateData) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('User not found');

    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;
    if (updateData.addresses) user.addresses = updateData.addresses;

    if (updateData.profilePicture) {
      const pic = updateData.profilePicture;
      if (pic.startsWith('data:image') || pic.length > 500) {
        const imageUrl = await uploadImage(pic, `profile_${id}`);
        user.profilePicture = imageUrl;
      } else {
        user.profilePicture = pic;
      }
    }

    return await user.save();
  }

  async addAddress(id, addressData) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('User not found');

    if (addressData.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    
    user.addresses.push(addressData);
    return await user.save();
  }

  async updateAddress(id, addressId, addressData) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('User not found');

    const address = user.addresses.id(addressId);
    if (!address) throw new Error('Address not found');

    if (addressData.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }

    Object.assign(address, addressData);
    return await user.save();
  }

  async removeAddress(id, addressId) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('User not found');

    user.addresses = user.addresses.filter(a => a._id.toString() !== addressId);
    return await user.save();
  }
}

module.exports = new UserService();
