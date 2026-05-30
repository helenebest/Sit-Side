const assert = require('assert');
const express = require('express');
const http = require('http');

function request(server, method, url, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: server.address().port,
        path: url,
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch (err) {
            reject(err);
            return;
          }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function listen(app) {
  return new Promise((resolve) => {
    const server = http.createServer(app).listen(0, () => resolve(server));
  });
}

async function verifyAdminRegistrationRejected() {
  const app = express();
  app.use(express.json());
  app.use('/auth', require('../backend/routes/auth'));

  const server = await listen(app);
  try {
    const res = await request(server, 'POST', '/auth/register', {
      email: 'attacker@example.com',
      password: 'correct-horse-battery-staple',
      firstName: 'Mallory',
      lastName: 'Admin',
      phone: '555-0100',
      userType: 'admin',
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Invalid user type');
  } finally {
    server.close();
  }
}

function installBookingsRouteMocks() {
  const rawBooking = {
    _id: 'booking-1',
    date: '2026-06-01T00:00:00.000Z',
    startTime: '09:00',
    endTime: '11:00',
    status: 'confirmed',
    serviceType: 'babysitter',
    emergencyContact: '555-private',
    specialInstructions: 'Meet-up address: private home',
    messages: [{ senderRole: 'parent', text: 'private message' }],
    parent: { firstName: 'Private', lastName: 'Parent' },
  };

  const state = {
    filter: null,
    select: null,
  };

  const bookingPath = require.resolve('../backend/models/Booking');
  const middlewarePath = require.resolve('../backend/middleware/auth');
  const originalBooking = require.cache[bookingPath];
  const originalMiddleware = require.cache[middlewarePath];

  const mockBookingModel = {
    find(filter) {
      state.filter = filter;
      const query = {
        select(selection) {
          state.select = selection;
          return query;
        },
        sort() {
          return query;
        },
        lean() {
          if (!state.select) return Promise.resolve([rawBooking]);
          const allowed = new Set(state.select.split(/\s+/).filter(Boolean));
          return Promise.resolve([
            Object.fromEntries(Object.entries(rawBooking).filter(([key]) => allowed.has(key))),
          ]);
        },
      };
      return query;
    },
  };

  require.cache[bookingPath] = {
    id: bookingPath,
    filename: bookingPath,
    loaded: true,
    exports: mockBookingModel,
  };

  require.cache[middlewarePath] = {
    id: middlewarePath,
    filename: middlewarePath,
    loaded: true,
    exports: {
      auth: (req, res, next) => {
        req.user = { _id: 'parent-1', userType: 'parent' };
        next();
      },
      requireStudentOrParent: (req, res, next) => next(),
    },
  };

  return {
    state,
    restore() {
      if (originalBooking) {
        require.cache[bookingPath] = originalBooking;
      } else {
        delete require.cache[bookingPath];
      }
      if (originalMiddleware) {
        require.cache[middlewarePath] = originalMiddleware;
      } else {
        delete require.cache[middlewarePath];
      }
      delete require.cache[require.resolve('../backend/routes/bookings')];
    },
  };
}

async function verifyCalendarEndpointRedactsPrivateBookingData() {
  const mocks = installBookingsRouteMocks();
  const app = express();
  app.use(express.json());
  app.use('/bookings', require('../backend/routes/bookings'));

  const server = await listen(app);
  try {
    const res = await request(server, 'GET', '/bookings/student/student-1?from=2026-06-01&to=2026-06-30');

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(mocks.state.filter.status, { $nin: ['cancelled', 'rejected'] });
    assert.strictEqual(mocks.state.select, '_id date startTime endTime status serviceType');
    assert.deepStrictEqual(Object.keys(res.body.bookings[0]).sort(), [
      '_id',
      'date',
      'endTime',
      'serviceType',
      'startTime',
      'status',
    ]);
    assert.strictEqual(res.body.bookings[0].emergencyContact, undefined);
    assert.strictEqual(res.body.bookings[0].specialInstructions, undefined);
    assert.strictEqual(res.body.bookings[0].messages, undefined);
    assert.strictEqual(res.body.bookings[0].parent, undefined);
  } finally {
    server.close();
    mocks.restore();
  }
}

(async () => {
  await verifyAdminRegistrationRejected();
  await verifyCalendarEndpointRedactsPrivateBookingData();
  console.log('OK: critical auth and booking privacy regressions are covered.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
