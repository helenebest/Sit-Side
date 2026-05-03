// Serverless API entrypoint (Vercel/Netlify) backed by MongoDB.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectToDatabase } = require('./lib/db');

const app = express();

// Vercel sets X-Forwarded-*; required so express-rate-limit and req.ip use the client, not the edge IP.
app.set('trust proxy', true);

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Ensure DB is connected for every request path.
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    const code = error && (error.codeName || error.code);
    console.error('Database connection failed:', code || error.name, error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/api/auth', require('../backend/routes/auth'));
app.use('/api/users', require('../backend/routes/users'));
app.use('/api/bookings', require('../backend/routes/bookings'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    storage: 'mongodb',
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
