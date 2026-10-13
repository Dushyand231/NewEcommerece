require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');

const demoUsers = [
  { name: 'Demo Shopper', email: 'demo@shopsphere.com', password: 'demo123', role: 'customer' },
];

async function seedDemoUsers() {
  await connectDB();
  for (const u of demoUsers) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.findOneAndUpdate({ email: u.email }, { ...u, password: hashed }, { upsert: true });
    console.log(`Demo user ready: ${u.email} / ${u.password}`);
  }
  process.exit(0);
}

seedDemoUsers().catch((e) => {
  console.error(e);
  process.exit(1);
});
