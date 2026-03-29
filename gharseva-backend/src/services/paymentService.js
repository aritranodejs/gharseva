const Razorpay = require('razorpay');
const crypto = require('crypto');
const paymentRepository = require('../repositories/paymentRepository');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

class PaymentService {
  async createOrder(amount, currency = 'INR') {
    const options = {
      amount: amount * 100,
      currency,
      receipt: `receipt_${Date.now()}`,
    };
    return await razorpay.orders.create(options);
  }

  async verifyPayment(orderId, paymentId, signature) {
    const sign = orderId + "|" + paymentId;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(sign.toString())
      .digest("hex");

    return signature === expectedSign;
  }

  async getMethods(userId) {
    return await paymentRepository.findByUserId(userId);
  }

  async addMethod(userId, methodData) {
    let { type, identifier, cardNumber } = methodData;

    if (type === 'card' && cardNumber) {
      if (!this.isValidCard(cardNumber)) throw new Error('Invalid card number (LUHN check failed)');
      // Securely store the actual card number, it will be encrypted by the repository
      identifier = cardNumber;
    }

    const exists = await paymentRepository.findByIdentifier(userId, identifier);
    if (exists) throw new Error('Payment method already saved');

    return await paymentRepository.create({
      userId,
      ...methodData,
      identifier,
      last4: type === 'card' ? cardNumber.slice(-4) : methodData.last4
    });
  }

  async removeMethod(id, userId) {
    return await paymentRepository.deleteById(id, userId);
  }

  isValidCard(number) {
    let sum = 0;
    let shouldDouble = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }
}

module.exports = new PaymentService();
