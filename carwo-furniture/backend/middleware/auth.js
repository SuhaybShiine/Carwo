const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'carwo_furniture_secret_key_2026';

// Token required
exports.protect = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. Please login.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Admin only
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.Role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};