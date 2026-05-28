/**
 * Verifies api/index.js clears a failed mongoose.connect so the next request retries.
 * Uses a dummy URI only so connectToDatabase() reaches mongoose.connect (mocked).
 */
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/dummy-for-verify-script';

const path = require('path');
const http = require('http');
const mongoose = require(path.join(__dirname, '..', 'node_modules', 'mongoose'));

let connectCalls = 0;
let mockReadyState = 0;
const realConnect = mongoose.connect.bind(mongoose);
const realDisconnect = mongoose.disconnect.bind(mongoose);
const readyStateDescriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');

Object.defineProperty(mongoose.connection, 'readyState', {
  configurable: true,
  get: () => mockReadyState,
});

mongoose.connect = (uri, opts) => {
  connectCalls += 1;
  mockReadyState = 2;
  if (connectCalls === 1) {
    mockReadyState = 0;
    return Promise.reject(new Error('simulated first-connect failure'));
  }
  mockReadyState = 1;
  return Promise.resolve(mongoose);
};
mongoose.disconnect = async () => {
  mockReadyState = 0;
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

    mockReadyState = 0;

    const r3 = await get('/api/health');
    if (r3.status !== 200) {
      console.error('Expected third /api/health after disconnect to be 200, got', r3.status, r3.body);
      process.exit(1);
    }

    if (connectCalls !== 3) {
      console.error('Expected mongoose.connect called again after disconnect, got', connectCalls);
      process.exit(1);
    }

    const r4 = await get('/api/health');
    if (r4.status !== 200) {
      console.error('Expected fourth /api/health while connected to be 200, got', r4.status, r4.body);
      process.exit(1);
    }

    if (connectCalls !== 3) {
      console.error('Expected connected request to reuse current connection, got', connectCalls);
      process.exit(1);
    }

    console.log('OK: failed connects and dropped connections are not cached.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    server.close();
    mongoose.connect = realConnect;
    mongoose.disconnect = realDisconnect;
    if (readyStateDescriptor) {
      Object.defineProperty(mongoose.connection, 'readyState', readyStateDescriptor);
    } else {
      delete mongoose.connection.readyState;
    }
  }
});
