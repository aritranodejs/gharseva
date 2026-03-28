const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a specific user/worker
 * @param {string} id - The MongoDB ID
 * @param {string} role - 'user' or 'worker'
 * @returns {string} JWT Token
 */
const generateToken = (id, role = 'user') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = { generateToken };
