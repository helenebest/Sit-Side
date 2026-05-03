const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

const GLOBAL_KEY = '__windwardMongoConnectPromise';

function validateMongoUri(raw) {
  const uri = (raw || '').trim().replace(/^\uFEFF/, '');
  if (!uri) {
    throw new Error('MONGODB_URI is required for persistent API storage.');
  }
  if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
    throw new Error(
      'MONGODB_URI must start with mongodb:// or mongodb+srv:// (check for typos or accidental quotes).'
    );
  }
  const lower = uri.toLowerCase();
  if (lower.includes('<password>') || lower.includes('<username>')) {
    throw new Error(
      'MONGODB_URI still contains <password> or <username>; replace those placeholders with real values (no angle brackets).'
    );
  }
  return uri;
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
  const dbName = (process.env.MONGODB_DB_NAME || '').trim();
  if (dbName) {
    opts.dbName = dbName;
  }
  if (process.env.MONGODB_DNS_FAMILY === '4') {
    opts.family = 4;
  }
  return opts;
}

/**
 * Cached connect promise on globalThis so warm Vercel isolates reuse one pool.
 * Clears cache on failure so the next request can retry after you fix Atlas/Vercel env.
 */
async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = validateMongoUri(process.env.MONGODB_URI);
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
      throw err;
    });
  }

  await g[GLOBAL_KEY];
}

module.exports = { connectToDatabase };
