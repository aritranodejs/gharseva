const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Worker = require('../models/Worker');

/**
 * General protect middleware for Users
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ message: 'User not found' });
      
      next();
    } catch (err) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * protectWorker middleware for Worker App
 */
const protectWorker = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log(`[AUTH] Verifying token for ${req.originalUrl}`);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`[AUTH] Token decoded successfully. ID: ${decoded.id}, Role: ${decoded.role}`);
      
      const worker = await Worker.findById(decoded.id || decoded._id);
      if (!worker) {
        console.log(`[AUTH] Worker NOT FOUND in database for ID: ${decoded.id || decoded._id}`);
        return res.status(401).json({ message: 'Not authorized, worker not found' });
      }
      
      console.log(`[AUTH] Worker verified: ${worker.name} (Status: ${worker.status})`);
      req.worker = worker;
      next();
    } catch (error) {
      console.log(`[AUTH] Verification FAILED for ${req.originalUrl}: ${error.message}`);
      if (error.name === 'TokenExpiredError') {
        console.log(`[AUTH] Reason: Token expired at ${error.expiredAt}`);
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log(`[AUTH] No Authorization header found for ${req.originalUrl}`);
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const protectAny = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Try User first
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }

      // Try Worker second
      const worker = await Worker.findById(decoded.id).select('-password');
      if (worker) {
        req.worker = worker;
        return next();
      }

      return res.status(401).json({ message: 'Profile not found' });
    } catch (err) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * adminOnly middleware to restrict access to admins
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, protectWorker, protectAny, adminOnly };
