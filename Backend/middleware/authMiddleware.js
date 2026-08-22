import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const protect = async (req, res, next) => {
  let token;

  // Assuming token can come from cookies or authorization header
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId || decoded.id).select('-password');
      if (!req.user) {
         return res.status(401).json({ message: 'User not found' });
      }
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId || decoded.id).select('-password');
    } catch (error) {
      console.warn('Optional auth token invalid, proceeding as guest');
    }
  }

  // If token wasn't provided or failed, check if userId exists in body/query
  if (!req.user && (req.body?.user || req.query?.userId)) {
    try {
      const userId = req.body?.user || req.query?.userId;
      if (userId && userId !== '000000000000000000000000') {
        req.user = await User.findById(userId).select('-password');
      }
    } catch (e) {
      // Ignored
    }
  }

  next();
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};
