require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');

const demoUsers = [
  { name: 'Ava Johnson', email: 'ava@shopsphere.com', password: 'password123', role: 'customer' },
  { name: 'Liam Smith', email: 'liam@shopsphere.com', password: 'password123', role: 'customer' },
  { name: 'Noah Patel', email: 'noah@shopsphere.com', password: 'password123', role: 'customer' },
  { name: 'Mia Garcia', email: 'mia@shopsphere.com', password: 'password123', role: 'customer' },
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
