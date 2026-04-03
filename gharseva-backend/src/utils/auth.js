const jwt = require('jsonwebtoken');

/**
 * Generate Access Token (short-lived)
 */
const generateAccessToken = (id, role = 'user') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
  });
};

/**
 * Generate Refresh Token (long-lived)
 */
const generateRefreshToken = (id, role = 'user') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
  });
};

/**
 * Generate both tokens
 */
const generateTokens = (id, role = 'user') => {
  return {
    accessToken: generateAccessToken(id, role),
    refreshToken: generateRefreshToken(id, role)
  };
};

module.exports = { generateAccessToken, generateRefreshToken, generateTokens };
