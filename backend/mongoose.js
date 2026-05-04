/**
 * Always load Mongoose from the repo root so we use the same instance that
 * api/lib/db connects — never a nested backend/node_modules/mongoose copy
 * (which caused buffering timeouts on Vercel).
 */
const path = require('path');

module.exports = require(path.join(__dirname, '..', 'node_modules', 'mongoose'));
