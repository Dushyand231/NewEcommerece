require('dotenv').config();
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
const clientBuildPath = path.resolve(__dirname, '../frontend/dist');

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, '').toLowerCase())
  .filter(Boolean);

app.set('trust proxy', 1);

function matchOrigin(pattern, origin) {
  if (!pattern.includes('*')) return pattern === origin;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(origin);
}

function isOriginAllowed(origin, req) {
  if (!origin) return true;
  const normalized = origin.replace(/\/+$/, '').toLowerCase();
  if (allowedOrigins.some((pattern) => matchOrigin(pattern, normalized))) return true;
  const selfOrigin = `${req.protocol}://${req.get('host')}`.toLowerCase();
  if (normalized === selfOrigin) return true;
  return false;
}

app.use((req, res, next) => {
  cors({
    origin(origin, cb) {
      if (isOriginAllowed(origin, req)) return cb(null, true);
      cb(new Error(`Not allowed by CORS (origin: ${origin})`));
    },
    credentials: true,
  })(req, res, next);
});
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '2mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) =>
  res.json({ success: true, status: 'ok', uptime: process.uptime() })
);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'ShopSphere API is running. Build the frontend and serve it from /frontend/dist to load the web app.',
    });
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const requiredEnv = ['MONGO_URI'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(
    `WARNING: missing required environment variable(s): ${missingEnv.join(
      ', '
    )}. Set them in Render -> Environment (or backend/.env locally).`
  );
}
if (!process.env.JWT_SECRET) {
  console.warn(
    'WARNING: JWT_SECRET is not set. Auth still works via a temporary random secret but ' +
      'sessions will be reset on every server restart. Set JWT_SECRET in Render -> ' +
      'Environment for stable sessions.'
  );
}

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
