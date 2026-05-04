const crypto = require('crypto');

/**
 * JWT signing secret. Prefer explicit JWT_SECRET (or SESSION_SECRET) in Vercel.
 * If unset, derive a stable secret from Mongo env so deploys work without an extra var
 * (tokens invalidate if DB credentials change — set JWT_SECRET for production best practice).
 */
function getJwtSecret() {
  const explicit = (process.env.JWT_SECRET || process.env.SESSION_SECRET || '').trim();
  if (explicit) {
    return explicit;
  }

  const uri = (process.env.MONGODB_URI || '').trim();
  if (uri) {
    return crypto.createHash('sha256').update('sit-side:jwt:v1:' + uri).digest('hex');
  }

  const user = (process.env.MONGODB_USER || process.env.MONGODB_USERNAME || '').trim();
  const password = process.env.MONGODB_PASSWORD != null ? String(process.env.MONGODB_PASSWORD) : '';
  const host = (process.env.MONGODB_HOST || '').trim();
  if (user && password && host) {
    return crypto
      .createHash('sha256')
      .update(`sit-side:jwt:v1:${user}@${host}:${password}`)
      .digest('hex');
  }

  throw new Error(
    'JWT_SECRET is not set. In Vercel: Settings → Environment Variables → add JWT_SECRET (e.g. output of openssl rand -hex 32), or ensure MongoDB env vars are set so a derived key can be used. Redeploy after saving.'
  );
}

module.exports = { getJwtSecret };
