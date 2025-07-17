const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  console.log('verifyToken called, headers:', req.headers);
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('verifyToken decoded:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Token verification failed' });
  }
};

exports.isAdmin = (req, res, next) => {
  console.log('isAdmin called, req.user:', req.user);
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    console.log('isAdmin access denied, req.user:', req.user);
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

exports.isStaffHead = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'staff_head') {
    return res.status(403).json({ error: 'Staff head access required' });
  }
  
  next();
};

exports.isMessStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'mess_staff' && req.user.role !== 'staff_head') {
    return res.status(403).json({ error: 'Mess staff access required' });
  }
  
  next();
};