const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { secret: JWT_SECRET, expiresIn: JWT_EXPIRES_IN } = require('../config/jwt');

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const shapeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(400, 'Email is already registered');

  const user = await User.create({ name, email, password });
  res.status(201).json({ success: true, token: signToken(user._id), user: shapeUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.isBlocked) throw new ApiError(403, 'Account is blocked');

  res.json({ success: true, token: signToken(user._id), user: shapeUser(user) });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: shapeUser(req.user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  const { name, phone, address } = req.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;

  await user.save();
  res.json({ success: true, user: shapeUser(user) });
});

const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new password are required');
  }
  if (newPassword.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated' });
});

module.exports = { register, login, getMe, updateProfile, updatePassword };
