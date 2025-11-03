// Netlify serverless function wrapper
const serverless = require('serverless-http');
const app = require('../../api/index');

exports.handler = serverless(app);

