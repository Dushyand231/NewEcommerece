const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function populateCart(cart) {
  return cart.populate({ path: 'items.product', select: 'name price images stock slug' });
}

const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  await populateCart(cart);
  res.json({ success: true, cart });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const qty = Math.max(1, Number(quantity));

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (item) {
    item.quantity = Math.min(product.stock, item.quantity + qty);
  } else {
    cart.items.push({ product: productId, quantity: Math.min(product.stock, qty) });
  }

  await cart.save();
  await populateCart(cart);
  res.json({ success: true, cart });
});

const syncCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  for (const incoming of items) {
    const product = await Product.findById(incoming.productId || incoming.product);
    if (!product) continue;
    const exist = cart.items.find((i) => i.product.toString() === product._id.toString());
    if (exist) {
      exist.quantity = Math.min(product.stock, exist.quantity + Number(incoming.quantity || 1));
    } else {
      cart.items.push({
        product: product._id,
        quantity: Math.min(product.stock, Number(incoming.quantity) || 1),
      });
    }
  }

  await cart.save();
  await populateCart(cart);
  res.json({ success: true, cart });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const qty = Number(req.body.quantity);
  if (!qty || qty < 1) throw new ApiError(400, 'Quantity must be at least 1');

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) throw new ApiError(404, 'Item not in cart');

  item.quantity = Math.min(product.stock, qty);
  await cart.save();
  await populateCart(cart);
  res.json({ success: true, cart });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();
  await populateCart(cart);
  res.json({ success: true, cart });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ success: true, cart });
});

module.exports = { getCart, addToCart, syncCart, updateCartItem, removeCartItem, clearCart };
