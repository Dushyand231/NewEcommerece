# ShopSphere — Full-Stack MERN E-Commerce

A complete, production-ready e-commerce platform deployed as a single service on **Render**, with data stored in **MongoDB Atlas** and images in **Cloudinary**.

- **Frontend:** React 18 + Vite + React Router + Axios
- **Backend:** Node.js + Express + Mongoose
- **Database:** MongoDB (Atlas / local)
- **Auth:** JWT + bcrypt, role-based (customer / admin)
- **Payments:** Razorpay (with server-side signature verification) + Cash on Delivery
- **Images:** Cloudinary (persistent) with local `/uploads` fallback
- **Security:** helmet, CORS allow-list, rate limiting, bcrypt hashing, server-side price/stock validation

```
.
├── backend/         Express API (serves the built frontend in production)
├── frontend/        React SPA (Vite)
└── render.yaml      Render blueprint (single Web Service)
```

## Features

- Homepage: hero, categories, featured and top-rated products
- Shop: search, category and price filters, sorting, pagination
- Product pages: gallery, ratings, stock, reviews
- Cart: guest (localStorage) + server-side cart for logged-in users (synced on login)
- Checkout: delivery form, COD / Razorpay, prices computed server-side
- Orders: history, detail, tracking, cancellation
- Reviews: 1-5 stars, one review per user per product, auto rating average
- Admin dashboard: stats, product CRUD with image upload, order status, user management

## Run locally

Requirements: Node.js 18+ and a MongoDB URI.

1. **Backend**
   ```
   cd backend
   npm install
   copy .env.example .env   # fill MONGO_URI and JWT_SECRET
   npm run seed             # inserts 15 products + admin account
   npm run dev              # http://localhost:5000
   ```
   Seeded admin: `admin@shopsphere.com` / `admin123` (override with `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`).

2. **Frontend**
   ```
   cd frontend
   npm install
   npm run dev              # http://localhost:5173 (proxies /api to :5000)
   ```

## Environment variables

**backend/.env** (see `backend/.env.example`):

| Key | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string (required) |
| `JWT_SECRET` | JWT signing secret (required) |
| `CLIENT_ORIGIN` | Comma-separated allowed CORS origins |
| `CLOUDINARY_*` | Optional - enables persistent image upload |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Optional - enables online payments |
| `FREE_DELIVERY_ABOVE` / `DELIVERY_FEE` | Delivery fee rules |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Credentials created by `npm run seed` |

**frontend/.env**:
```
VITE_API_URL=          # empty for local dev and for the single-service Render deploy
```

## API endpoints

```
POST   /api/auth/register  POST /api/auth/login
GET    /api/auth/me        PUT  /api/auth/profile   PUT /api/auth/password
GET    /api/products       GET  /api/products/:id    GET /api/products/categories
POST   /api/products       PUT  /api/products/:id    DELETE /api/products/:id   (admin)
GET    /api/cart           POST /api/cart            POST /api/cart/sync
PUT    /api/cart/:productId  DELETE /api/cart/:productId  DELETE /api/cart
POST   /api/orders         GET  /api/orders/my-orders  GET /api/orders/:id  POST /api/orders/:id/cancel
GET    /api/reviews/product/:id   POST /api/reviews/product/:id
GET    /api/payments/config  POST /api/payments/order  POST /api/payments/verify
GET    /api/admin/stats    GET  /api/admin/orders    PATCH /api/admin/orders/:id/status
GET    /api/admin/users    PATCH /api/admin/users/:id/status
GET    /api/health
```

## Deploy on Render (single Web Service)

### 1. Create the database — MongoDB Atlas
1. Create a free **M0** cluster at mongodb.com/atlas.
2. Create a database user and, under **Network Access**, allow `0.0.0.0/0`.
3. Click **Connect -> Drivers** and copy the `mongodb+srv://...` connection string.

### 2. Create the image store — Cloudinary (optional but recommended)
1. Sign up at cloudinary.com and copy your **Cloud Name**, **API Key** and **API Secret**.
2. Without these, uploads are written to `backend/uploads/`, which is **ephemeral** on Render.

### 3. Deploy
1. Push this repo to GitHub (branch `main`).
2. In Render: **New -> Blueprint** (uses `render.yaml`) or **New -> Web Service** with:
   - **Root Directory:** repo root (leave blank)
   - **Build Command:** `npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build`
   - **Start Command:** `node backend/server.js`
   - **Health Check Path:** `/api/health`
3. Set the environment variables (see table above). Set `CLIENT_ORIGIN` to your Render URL,
   e.g. `https://shopsphere.onrender.com`.
4. **Auto-deploy** is enabled — every push to `main` redeploys.

### 4. Seed production data
Once deployed, run the seed against Atlas (locally with the Atlas `MONGO_URI`, or via Render Shell):
```
npm --prefix backend run seed
npm --prefix backend run seed:demo   # optional demo customer: demo@shopsphere.com / demo123
```

### 5. Verify
- `GET https://<your-service>.onrender.com/api/health` -> `{ "success": true }`
- Homepage loads; login/register work; admin can create a product with an image; COD checkout works.

## Notes

- Render's **free tier** spins down when idle (~50s cold start on first request).
- The container filesystem is **ephemeral**; use Cloudinary so uploaded images survive redeploys.
- Online payments require your own Razorpay keys; otherwise only Cash on Delivery is offered.
