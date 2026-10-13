const express = require('express');
const { getProductReviews, createReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/product/:id', getProductReviews);
router.post('/product/:id', protect, createReview);

module.exports = router;
