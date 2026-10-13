const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Product = require('../models/Product');
const Review = require('../models/Review');

async function recalcProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = stats[0]?.avg || 0;
  const count = stats[0]?.count || 0;
  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avg * 10) / 10,
    numReviews: count,
  });
}

const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, reviews });
});

const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await Review.findOne({ user: req.user._id, product: productId });
  if (existing) throw new ApiError(400, 'You have already reviewed this product');

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    name: req.user.name,
    rating: Number(rating),
    comment,
  });

  await recalcProductRating(product._id);
  res.status(201).json({ success: true, review });
});

module.exports = { getProductReviews, createReview };
