const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const getStats = asyncHandler(async (req, res) => {
  const [users, products, orders, revenueAgg, buyersAgg, recentOrders] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: '$user' } },
      { $count: 'buyers' },
    ]),
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
  ]);

  res.json({
    success: true,
    stats: {
      users,
      products,
      orders,
      buyers: buyersAgg[0]?.buyers || 0,
      revenue: revenueAgg[0]?.total || 0,
    },
    recentOrders,
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && status !== 'All') filter.status = status;
  const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowed.includes(status)) throw new ApiError(400, 'Invalid status');

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  order.status = status;
  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }
  await order.save();
  res.json({ success: true, order });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, users });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { isBlocked } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Cannot block an admin account');

  user.isBlocked = Boolean(isBlocked);
  await user.save();
  res.json({ success: true, user: { _id: user._id, isBlocked: user.isBlocked } });
});

module.exports = { getStats, getOrders, updateOrderStatus, getUsers, updateUserStatus };
