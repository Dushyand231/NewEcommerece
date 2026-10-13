const mongoose = require('mongoose');

// Recover a usable connection string from common copy/paste mistakes:
// surrounding quotes, a pasted "MONGO_URI=" prefix, leading/trailing spaces,
// stray newlines, or the value wrapped in backticks.
function sanitizeUri(raw) {
  if (!raw) return '';
  let uri = String(raw).replace(/^\uFEFF/, '').trim();

  uri = uri.replace(/^['"`]+|['"`]+$/g, '').trim();

  const match = uri.match(/mongodb(\+srv)?:\/\/[\s\S]*/i);
  if (match) uri = match[0];

  uri = uri.replace(/['"`\s]+/g, '');

  return uri;
}

// Hide username/password before logging.
function maskUri(uri) {
  return (uri || '').replace(/:\/\/[^@/]*@/, '://***:***@');
}

async function connectDB() {
  const uri = sanitizeUri(process.env.MONGO_URI);

  if (!uri) {
    throw new Error(
      'MONGO_URI is not defined or empty. Set it in backend/.env locally and in the Render dashboard.'
    );
  }

  if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
    throw new Error(
      `MONGO_URI is invalid: expected "mongodb://" or "mongodb+srv://". ` +
        `Got: ${JSON.stringify(maskUri(uri).slice(0, 40))} (length ${uri.length}). ` +
        'Remove surrounding quotes/spaces or a pasted "MONGO_URI=" prefix.'
    );
  }

  mongoose.set('strictQuery', true);
  console.log(`Connecting to MongoDB: ${maskUri(uri).slice(0, 45)}...`);
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Retrying in 5s...');
  setTimeout(() => {
    if (mongoose.connection.readyState === 0) {
      mongoose
        .connect(sanitizeUri(process.env.MONGO_URI))
        .catch((e) => console.error('Reconnect failed:', e.message));
    }
  }, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = { connectDB };
