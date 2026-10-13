require('dotenv').config();
const { connectDB } = require('../config/db');
const User = require('../models/User');

const password = 'password123';

const customers = [
  { name: 'Henry Adams', email: 'henry@shopsphere.com', password },
  { name: 'Grace Lewis', email: 'grace@shopsphere.com', password },
  { name: 'Lucas Walker', email: 'lucas@shopsphere.com', password },
  { name: 'Zoe Hughes', email: 'zoe@shopsphere.com', password },
  { name: 'Leo Ramirez', email: 'leo@shopsphere.com', password },
];

const adminEmail = (process.env.ADMIN_SEED_EMAIL || 'admin@shopsphere.com').toLowerCase();
const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'admin123';

async function resetUsers() {
  await connectDB();

  const removed = await User.deleteMany({});
  console.log(`Removed ${removed.deletedCount} user account(s).`);

  await User.create({
    name: 'ShopSphere Admin',
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
  });
  console.log(`Admin ready:    ${adminEmail} / ${adminPassword}`);

  for (const customer of customers) {
    await User.create({ ...customer, role: 'customer' });
  }
  console.log(`Customer accounts (${customers.length}):`);
  customers.forEach((c) => console.log(`  ${c.email} / ${c.password}`));

  process.exit(0);
}

resetUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
