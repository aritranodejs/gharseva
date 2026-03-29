const PaymentMethod = require('../models/PaymentMethod');
const { encrypt, decrypt } = require('../utils/encryption');
const crypto = require('crypto');

class PaymentRepository {
  async findByUserId(userId) {
    const records = await PaymentMethod.find({ userId });
    return records.map(r => {
      const plain = r.toObject();
      plain.identifier = decrypt(r.identifier);
      if (plain.type === 'card' && plain.last4) {
        plain.identifier = `**** **** **** ${plain.last4}`;
      }
      return plain;
    });
  }

  async findByIdentifier(userId, identifier) {
    const hashedIdentifier = crypto.createHash('sha256').update(identifier).digest('hex');
    const record = await PaymentMethod.findOne({ userId, hashedIdentifier });
    if (record) {
      const plain = record.toObject();
      plain.identifier = decrypt(record.identifier);
      return plain;
    }
    return null;
  }

  async create(data) {
    const { identifier } = data;
    const hashedIdentifier = crypto.createHash('sha256').update(identifier).digest('hex');
    const encryptedIdentifier = encrypt(identifier);
    
    return await PaymentMethod.create({
      ...data,
      identifier: encryptedIdentifier,
      hashedIdentifier
    });
  }

  async deleteById(id, userId) {
    return await PaymentMethod.findOneAndDelete({ _id: id, userId });
  }
}

module.exports = new PaymentRepository();
