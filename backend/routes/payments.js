const express = require('express');
const {
  getPaymentConfig,
  createRazorpayOrder,
  verifyPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
