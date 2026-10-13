const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Product = require('../models/Product');
const { uploadImage, deleteImage } = require('../services/imageService');

const getProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sort = 'newest',
    page = 1,
    limit = 12,
    featured,
  } = req.query;

  const filter = {};
  if (search) filter.$text = { $search: search };
  if (category && category !== 'All') filter.category = category;
  if (featured === 'true') filter.featured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    newest: { createdAt: -1 },
    priceAsc: { price: 1 },
    priceDesc: { price: -1 },
    rating: { rating: -1 },
    name: { name: 1 },
  };

  const pageNum = Math.max(1, Number(page));
  const perPage = Math.min(48, Math.max(1, Number(limit)));

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((pageNum - 1) * perPage)
      .limit(perPage),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    page: pageNum,
    pages: Math.ceil(total / perPage) || 1,
    total,
  });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json({ success: true, categories: categories.sort() });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, brand, category, price, actualPrice, stock, featured } = req.body;
  if (!name || !category || price === undefined) {
    throw new ApiError(400, 'Name, category and price are required');
  }

  const images = [];
  if (req.files && req.files.length) {
    for (const file of req.files) {
      const url = await uploadImage(file);
      if (url) images.push(url);
    }
  }
  if (req.body.images) {
    const extra = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    images.push(...extra.filter(Boolean));
  }

  const product = await Product.create({
    name,
    description,
    brand,
    category,
    price: Number(price),
    actualPrice: actualPrice ? Number(actualPrice) : 0,
    stock: stock ? Number(stock) : 0,
    featured: featured === true || featured === 'true',
    images,
  });

  res.status(201).json({ success: true, product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const fields = ['name', 'description', 'brand', 'category', 'price', 'actualPrice', 'stock', 'featured'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      product[f] = ['price', 'actualPrice', 'stock'].includes(f) ? Number(req.body[f]) : req.body[f];
    }
  });

  const newImages = [];
  if (req.files && req.files.length) {
    for (const file of req.files) {
      const url = await uploadImage(file);
      if (url) newImages.push(url);
    }
  }
  if (req.body.images) {
    const extra = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    product.images = extra.filter(Boolean);
  }
  if (newImages.length) product.images = [...product.images, ...newImages];

  await product.save();
  res.json({ success: true, product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  await Promise.all(product.images.map((url) => deleteImage(url).catch(() => {})));
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

module.exports = {
  getProducts,
  getCategories,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
