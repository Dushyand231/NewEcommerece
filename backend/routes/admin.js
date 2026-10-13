const express = require('express');
const {
  getStats,
  getOrders,
  updateOrderStatus,
  getUsers,
  updateUserStatus,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.use(protect, admin);

router.get('/stats', getStats);
router.get('/orders', getOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

module.exports = router;
