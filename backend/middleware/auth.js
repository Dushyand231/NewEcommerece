const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) token = header.split(' ')[1];

  if (!token) throw new ApiError(401, 'Not authorized, no token');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Not authorized, token failed');
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) throw new ApiError(401, 'User no longer exists');
  if (user.isBlocked) throw new ApiError(403, 'Account is blocked');

  req.user = user;
  next();
});

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  next(new ApiError(403, 'Admin access required'));
};

module.exports = { protect, admin };
