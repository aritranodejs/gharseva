const jwt = require('jsonwebtoken');
const tokenStore = require('../utils/tokenStore');
const { generateAccessToken, generateRefreshToken } = require('../utils/auth');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const User = require('../models/User');
const Worker = require('../models/Worker');

class AuthController {
  /**
   * Refresh Access Token
   */
  async refresh(req, res) {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 'Refresh token required', 400);

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      // Check if refresh token exists in store (rotation check)
      const storedId = await tokenStore.get(`rf_${refreshToken}`);
      if (!storedId) {
        return sendError(res, 'Invalid or expired refresh token', 401);
      }

      // Rotate token: Delete the used one
      await tokenStore.del(`rf_${refreshToken}`);

      // Generate new pair
      const newAccessToken = generateAccessToken(decoded.id, decoded.role);
      const newRefreshToken = generateRefreshToken(decoded.id, decoded.role);

      // Store the new one
      await tokenStore.set(`rf_${newRefreshToken}`, decoded.id, 7 * 24 * 60 * 60);

      sendSuccess(res, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }, 'Token refreshed successfully');
    } catch (err) {
      sendError(res, 'Session expired, please login again', 401);
    }
  }

  /**
   * Logout - Blacklist/Remove session
   */
  async logout(req, res) {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await tokenStore.del(`rf_${refreshToken}`);
    }
    sendSuccess(res, null, 'Logged out successfully');
  }
}

module.exports = new AuthController();
