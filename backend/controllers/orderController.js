const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const FREE_DELIVERY_ABOVE = Number(process.env.FREE_DELIVERY_ABOVE ?? 999);
const DELIVERY_FEE = Number(process.env.DELIVERY_FEE ?? 49);

function computeTotals(items) {
  const itemsPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = itemsPrice >= FREE_DELIVERY_ABOVE || itemsPrice === 0 ? 0 : DELIVERY_FEE;
  return { itemsPrice, deliveryFee, totalPrice: itemsPrice + deliveryFee };
}

const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'COD' } = req.body;

  if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.city) {
    throw new ApiError(400, 'A complete shipping address is required');
  }
  if (!['COD', 'RAZORPAY'].includes(paymentMethod)) {
    throw new ApiError(400, 'Invalid payment method');
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || !cart.items.length) throw new ApiError(400, 'Your cart is empty');

  const items = [];
  for (const cartItem of cart.items) {
    const product = cartItem.product;
    if (!product) continue;
    if (product.stock < cartItem.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }
    items.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || '',
      price: product.price,
      quantity: cartItem.quantity,
    });
  }
  if (!items.length) throw new ApiError(400, 'Your cart is empty');

  const totals = computeTotals(items);

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    ...totals,
    status: 'Processing',
  });

  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }
  cart.items = [];
  await cart.save();

  res.status(201).json({ success: true, order });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to view this order');
  }

  res.json({ success: true, order });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized');
  }
  if (['Shipped', 'Delivered'].includes(order.status)) {
    throw new ApiError(400, 'Order cannot be cancelled at this stage');
  }
  if (order.status === 'Cancelled') throw new ApiError(400, 'Order is already cancelled');

  order.status = 'Cancelled';
  order.cancelledAt = new Date();
  await order.save();

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }

  res.json({ success: true, order });
});

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder };
