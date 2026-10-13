const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Order = require('../models/Order');
const { isRazorpayConfigured, getRazorpay } = require('../services/razorpay');
const { verifyRazorpaySignature } = require('../services/paymentVerify');

const getPaymentConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    razorpayEnabled: isRazorpayConfigured(),
    keyId: isRazorpayConfigured() ? process.env.RAZORPAY_KEY_ID : null,
  });
});

const createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) throw new ApiError(503, 'Online payment is not configured');
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized');
  if (order.isPaid) throw new ApiError(400, 'Order is already paid');

  const razorpay = getRazorpay();
  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(order.totalPrice * 100),
    currency: 'INR',
    receipt: order.orderNumber,
  });

  order.paymentResult = { ...order.paymentResult, razorpayOrderId: rzpOrder.id };
  await order.save();

  res.json({
    success: true,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    orderNumber: order.orderNumber,
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) throw new ApiError(503, 'Online payment is not configured');

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized');

  const valid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!valid) {
    order.paymentStatus = 'failed';
    await order.save();
    throw new ApiError(400, 'Payment verification failed');
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentStatus = 'paid';
  order.paymentResult = {
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  };
  await order.save();

  res.json({ success: true, order });
});

module.exports = { getPaymentConfig, createRazorpayOrder, verifyPayment };
