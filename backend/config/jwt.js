const crypto = require('crypto');

const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

let secret = process.env.JWT_SECRET;
if (!secret) {
  secret = crypto.randomBytes(48).toString('hex');
  console.warn(
    'WARNING: JWT_SECRET is not set. Using a temporary random secret so auth works, but ' +
      'sessions will be reset whenever the server restarts. Set JWT_SECRET in Render -> ' +
      'Environment (or backend/.env locally) for a stable secret.'
  );
}

module.exports = { secret, expiresIn: EXPIRES_IN };