/**
 * Verifies api/index.js clears a failed mongoose.connect so the next request retries.
 * Uses a dummy URI only so connectToDatabase() reaches mongoose.connect (mocked).
 */
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/dummy-for-verify-script';

const http = require('http');
const mongoose = require('mongoose');

let connectCalls = 0;
const realConnect = mongoose.connect.bind(mongoose);
mongoose.connect = (uri, opts) => {
  connectCalls += 1;
  if (connectCalls === 1) {
    return Promise.reject(new Error('simulated first-connect failure'));
  }
  return Promise.resolve(mongoose);
};

const app = require('../api/index.js');

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: server.address().port,
        path,
        method: 'GET',
      },
      (res) => {
        let body = '';
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, body });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

const server = http.createServer(app).listen(0, async () => {
  try {
    const r1 = await get('/api/health');
    if (r1.status !== 500) {
      console.error('Expected first /api/health to be 500, got', r1.status, r1.body);
      process.exit(1);
    }

    const r2 = await get('/api/health');
    if (r2.status !== 200) {
      console.error('Expected second /api/health to be 200, got', r2.status, r2.body);
      process.exit(1);
    }

    if (connectCalls !== 2) {
      console.error('Expected mongoose.connect called twice, got', connectCalls);
      process.exit(1);
    }

    console.log('OK: failed connect is not cached; second request succeeded.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    server.close();
    mongoose.connect = realConnect;
  }
});
