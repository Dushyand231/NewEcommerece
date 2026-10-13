require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');

const categories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Toys', 'Other'];

const products = [
  { name: 'Wireless Noise-Cancelling Headphones', description: 'Over-ear Bluetooth headphones with active noise cancellation and 40-hour battery life.', brand: 'SoundMax', category: 'Electronics', price: 3499, actualPrice: 4999, stock: 40, featured: true },
  { name: 'Smart Fitness Watch', description: 'AMOLED display, heart-rate tracking, GPS and 10-day battery. iOS & Android compatible.', brand: 'FitCore', category: 'Electronics', price: 2999, actualPrice: 3999, stock: 60, featured: true },
  { name: 'Portable Bluetooth Speaker', description: 'IPX7 waterproof, 360-degree sound, 20-hour playtime. Perfect for travel and parties.', brand: 'SoundMax', category: 'Electronics', price: 1499, actualPrice: 2499, stock: 80 },
  { name: 'Classic Running Shoes', description: 'Lightweight breathable mesh shoes with responsive cushioning for everyday runs.', brand: 'Stride', category: 'Fashion', price: 2499, actualPrice: 3499, stock: 45, featured: true },
  { name: 'Unisex Cotton Bomber Jacket', description: 'Premium cotton bomber jacket - a timeless layering staple in multiple colors.', brand: 'UrbanRoost', category: 'Fashion', price: 1899, actualPrice: 2799, stock: 35 },
  { name: 'Leather Casual Sneakers', description: 'Hand-finished leather sneakers with a cushioned insole.', brand: 'Stride', category: 'Fashion', price: 3299, actualPrice: 4299, stock: 25 },
  { name: 'Copper Coffee Maker', description: 'Stovetop mocha pot for rich espresso-style coffee. 300ml capacity.', brand: 'HomeCraft', category: 'Home', price: 1299, actualPrice: 1799, stock: 50, featured: true },
  { name: 'Merino Wool Throw Blanket', description: 'Ultra-soft merino wool throw, machine washable, 130x170 cm.', brand: 'HomeCraft', category: 'Home', price: 2199, actualPrice: 2999, stock: 30 },
  { name: 'LED Desk Lamp', description: 'Adjustable color temperature and brightness. USB powered, eye-care certified.', brand: 'Lumen', category: 'Home', price: 899, actualPrice: 1299, stock: 100 },
  { name: 'Vitamin C Brightening Serum', description: '10% Vitamin C with hyaluronic acid for radiant skin. Dermatologist approved.', brand: 'GlowLab', category: 'Beauty', price: 699, actualPrice: 999, stock: 120 },
  { name: 'Moisturizing Shampoo Bar', description: 'Plastic-free nourishing shampoo bar with argan oil. Lasts up to 80 washes.', brand: 'GlowLab', category: 'Beauty', price: 399, actualPrice: 599, stock: 75 },
  { name: 'Yoga Mat with Carry Strap', description: '6mm non-slip premium TPE yoga mat with alignment lines.', brand: 'ZenFit', category: 'Sports', price: 1099, actualPrice: 1599, stock: 55, featured: true },
  { name: 'Dumbbell Set (10kg)', description: 'Pair of hex rubber-coated dumbbells for home workouts.', brand: 'ZenFit', category: 'Sports', price: 2499, actualPrice: 3299, stock: 20 },
  { name: 'Bestselling Self-Help Collection', description: 'A curated 3-book collection on productivity and mindset.', brand: 'PageTurn', category: 'Books', price: 999, actualPrice: 1499, stock: 90, featured: true },
  { name: 'Robotic STEM Building Kit', description: '500+ pieces, app-controlled robot for kids aged 8 and above.', brand: 'ToyNest', category: 'Toys', price: 2799, actualPrice: 3799, stock: 40 },
  { name: 'Illustrated World Cookbook', description: 'A beautifully illustrated cookbook with 120 recipes from around the world.', brand: 'PageTurn', category: 'Books', price: 1299, actualPrice: 1899, stock: 60 },
  { name: 'Wooden Marble Run Set', description: '100-piece wooden marble run that builds spatial reasoning and creativity.', brand: 'ToyNest', category: 'Toys', price: 1999, actualPrice: 2799, stock: 35, featured: true },
  { name: 'Stainless Steel Insulated Bottle', description: 'Double-walled 750ml bottle keeps drinks cold for 24h or hot for 12h.', brand: 'HomeCraft', category: 'Other', price: 899, actualPrice: 1299, stock: 110 },
  { name: 'Canvas Everyday Tote Bag', description: 'Durable cotton canvas tote with an inner pocket and reinforced handles.', brand: 'UrbanRoost', category: 'Other', price: 799, actualPrice: 1199, stock: 95 },
];

async function seed() {
  await connectDB();

  const adminEmail = (process.env.ADMIN_SEED_EMAIL || 'admin@shopsphere.com').toLowerCase();
  await Product.deleteMany();

  const hashedPassword = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || 'admin123', 10);
  await User.findOneAndUpdate(
    { email: adminEmail },
    { name: 'ShopSphere Admin', email: adminEmail, password: hashedPassword, role: 'admin' },
    { upsert: true, runValidators: true }
  );

  const docs = products.map((p) => ({
    ...p,
    category: categories.includes(p.category) ? p.category : 'Other',
    images: [1, 2, 3].map(
      (n) => `https://picsum.photos/seed/${encodeURIComponent(`${p.name}-${n}`)}/600/400`
    ),
  }));
  await Product.insertMany(docs);

  const count = await Product.countDocuments();
  console.log(`Seeded ${count} products. Categories: ${categories.join(', ')}`);
  console.log(`Admin: ${adminEmail} / ${process.env.ADMIN_SEED_PASSWORD || 'admin123'}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
