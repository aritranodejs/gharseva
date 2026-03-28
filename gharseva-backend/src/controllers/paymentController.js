const paymentService = require('../services/paymentService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class PaymentController {
  async createOrder(req, res) {
    const { amount, currency } = req.body;
    try {
      const order = await paymentService.createOrder(amount, currency);
      sendSuccess(res, order);
    } catch (err) {
      sendError(res, 'Failed to create payment order');
    }
  }

  async verifyPayment(req, res) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    try {
      const isValid = await paymentService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (isValid) {
        sendSuccess(res, null, 'Payment verified successfully');
      } else {
        sendError(res, 'Invalid signature', 400);
      }
    } catch (err) {
      sendError(res, 'Internal server error during verification');
    }
  }

  async getMethods(req, res) {
    try {
      const methods = await paymentService.getMethods(req.user._id);
      sendSuccess(res, methods);
    } catch (err) {
      sendError(res, 'Error fetching payment methods');
    }
  }

  async addMethod(req, res) {
    try {
      await paymentService.addMethod(req.user._id, req.body);
      const methods = await paymentService.getMethods(req.user._id);
      sendSuccess(res, methods, 'Payment method saved', 201);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async removeMethod(req, res) {
    try {
      await paymentService.removeMethod(req.params.id, req.user._id);
      const methods = await paymentService.getMethods(req.user._id);
      sendSuccess(res, methods, 'Payment method removed');
    } catch (err) {
      sendError(res, 'Error deleting payment method');
    }
  }

  async verifyUpi(req, res) {
    const { upiId } = req.body;
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiId || !upiRegex.test(upiId)) {
      return sendError(res, 'Invalid UPI ID format', 400);
    }
    const blacklisted = ['test@upi', 'admin@okaxis', '123@ybl'];
    if (blacklisted.includes(upiId.toLowerCase())) {
      return sendError(res, 'UPI ID not found in banking records', 404);
    }
    
    // Simulate banking network logic
    setTimeout(() => {
      sendSuccess(res, { verifiedId: upiId, accountHolder: req.user.name }, 'UPI ID Verified Successfully');
    }, 1200);
  }
}

module.exports = new PaymentController();
