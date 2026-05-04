const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

const GLOBAL_KEY = '__windwardMongoConnectPromise';

/** Remove mistaken Atlas template brackets. */
function stripAngleBrackets(value) {
  const t = (value || '').trim();
  if (t.startsWith('<') && t.endsWith('>')) {
    return t.slice(1, -1).trim();
  }
  return t;
}

function validateMongoUriString(uri) {
  if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
    throw new Error(
      'Mongo URI must start with mongodb:// or mongodb+srv:// (check for typos or accidental quotes in Vercel).'
    );
  }
  const lower = uri.toLowerCase();
  if (lower.includes('<password>') || lower.includes('<username>')) {
    throw new Error(
      'Connection string still contains <password> or <username>. Replace with real values, or use MONGODB_USER + MONGODB_PASSWORD + MONGODB_HOST instead (no angle brackets).'
    );
  }
  return uri;
}

/**
 * Prefer split credentials on Vercel: password is always URL-encoded here, so special
 * characters (! @ # etc.) never break auth. Set MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST.
 * If those are not all set, falls back to MONGODB_URI.
 */
function resolveMongoUri() {
  const user = stripAngleBrackets(process.env.MONGODB_USER || process.env.MONGODB_USERNAME || '');
  const password = process.env.MONGODB_PASSWORD != null ? String(process.env.MONGODB_PASSWORD) : '';
  const hostRaw = stripAngleBrackets(process.env.MONGODB_HOST || '');

  if (user && password && hostRaw) {
    let host = hostRaw
      .replace(/^mongodb\+srv:\/\//i, '')
      .replace(/^mongodb:\/\//i, '')
      .split('/')[0]
      .split('?')[0]
      .trim();
    if (!host || host.includes(' ') || host.includes('@')) {
      throw new Error(
        'MONGODB_HOST must be the hostname only (e.g. cluster0.abcd123.mongodb.net), not a full connection string.'
      );
    }
    const authSource = stripAngleBrackets(process.env.MONGODB_AUTH_SOURCE || 'admin');
    const appName = stripAngleBrackets(process.env.MONGODB_APP_NAME || 'sit-side');
    const qs = new URLSearchParams({
      retryWrites: 'true',
      w: 'majority',
      authSource,
      appName,
    });
    const uri = `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/?${qs.toString()}`;
    return validateMongoUriString(uri);
  }

  const raw = (process.env.MONGODB_URI || '').trim().replace(/^\uFEFF/, '');
  if (!raw) {
    throw new Error(
      'MongoDB is not configured. In Vercel: set MONGODB_URI from Atlas, OR set all three — MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST (hostname only). Split vars avoid manual percent-encoding and angle-bracket mistakes. Redeploy after saving.'
    );
  }
  return validateMongoUriString(raw);
}

function buildConnectOptions() {
  const opts = {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    retryWrites: true,
  };
  const dbName = stripAngleBrackets(process.env.MONGODB_DB_NAME || '');
  if (dbName) {
    opts.dbName = dbName;
  }
  if (process.env.MONGODB_DNS_FAMILY === '4') {
    opts.family = 4;
  }
  return opts;
}

function logAuthHint(err) {
  const msg = String(err?.message || '').toLowerCase();
  const badAuth =
    msg.includes('bad auth') ||
    msg.includes('authentication failed') ||
    err?.code === 8000 ||
    err?.codeName === 'AtlasError';
  if (!badAuth) return;
  console.error(
    'Atlas auth failed: verify Database Access user + password in Atlas. On Vercel, prefer MONGODB_USER, MONGODB_PASSWORD, and MONGODB_HOST (split vars) so special characters in the password are encoded automatically; remove a stale MONGODB_URI if you switch to split vars.'
  );
}

/**
 * Cached connect promise on globalThis so warm Vercel isolates reuse one pool.
 * Clears cache on failure so the next request can retry after you fix Atlas/Vercel env.
 */
async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = resolveMongoUri();
  const connectOpts = buildConnectOptions();

  const g = globalThis;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = mongoose.connect(uri, connectOpts).catch(async (err) => {
      g[GLOBAL_KEY] = null;
      try {
        await mongoose.disconnect();
      } catch {
        /* ignore */
      }
      const code = err && (err.codeName || err.code);
      console.error('MongoDB connect failed:', code || err.name, err.message);
      logAuthHint(err);
      throw err;
    });
  }

  await g[GLOBAL_KEY];
}

module.exports = { connectToDatabase };
