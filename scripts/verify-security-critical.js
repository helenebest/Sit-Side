const assert = require('assert');
const http = require('http');
const Module = require('module');

const express = require('express');

const usersByToken = {
  parent: { _id: 'parent-1', userType: 'parent' },
  student: { _id: 'student-1', userType: 'student' },
};

const captured = {
  userFindFilters: [],
  userFindOneFilters: [],
  bookingFindFilters: [],
};

function cloneDoc(doc) {
  return { ...doc };
}

class Query {
  constructor(docs) {
    this.docs = docs;
    this.selectedFields = null;
  }

  select(fields) {
    this.selectedFields = String(fields || '')
      .split(/\s+/)
      .filter(Boolean);
    return this;
  }

  sort() {
    return this;
  }

  skip() {
    return this;
  }

  limit() {
    return this;
  }

  populate() {
    return this;
  }

  then(resolve, reject) {
    const docs = this.docs.map((doc) => {
      const plain = cloneDoc(doc);
      if (!this.selectedFields) {
        return {
          ...plain,
          toObject: () => cloneDoc(plain),
        };
      }

      const selected = {};
      for (const field of this.selectedFields) {
        if (Object.prototype.hasOwnProperty.call(plain, field)) {
          selected[field] = plain[field];
        }
      }
      return {
        ...selected,
        toObject: () => cloneDoc(selected),
      };
    });

    return Promise.resolve(docs).then(resolve, reject);
  }
}

function MockUser(data) {
  Object.assign(this, data);
}

MockUser.prototype.save = async function save() {
  throw new Error('User.save should not be called by these regression checks');
};

MockUser.findOne = async (filter) => {
  captured.userFindOneFilters.push(filter);

  if (filter.email) {
    return null;
  }

  if (filter._id === 'unverified-student') {
    return filter.isVerified === true
      ? null
      : { _id: 'unverified-student', userType: 'student', isActive: true, isVerified: false, hourlyRate: 15 };
  }

  return null;
};

MockUser.find = (filter) => {
  captured.userFindFilters.push(filter);
  return new Query([]);
};

MockUser.countDocuments = async () => 0;

function MockBooking(payload) {
  Object.assign(this, payload);
  this.messages = [];
}

MockBooking.prototype.save = async function save() {
  throw new Error('Booking.save should not be reached for unverified students');
};

MockBooking.prototype.populate = async function populate() {
  return this;
};

MockBooking.find = (filter) => {
  captured.bookingFindFilters.push(filter);
  return new Query([
    {
      _id: 'public-booking',
      student: 'student-1',
      parent: 'other-parent',
      date: '2026-06-01T00:00:00.000Z',
      startTime: '09:00',
      endTime: '10:00',
      status: 'pending',
      serviceType: 'babysitter',
      emergencyContact: 'private emergency contact',
      specialInstructions: 'private instructions',
      childrenAges: [4, 7],
    },
    {
      _id: 'own-booking',
      student: 'student-1',
      parent: 'parent-1',
      date: '2026-06-02T00:00:00.000Z',
      startTime: '11:00',
      endTime: '12:00',
      status: 'confirmed',
      serviceType: 'tutor',
      emergencyContact: 'own emergency contact',
    },
  ]);
};

function auth(req, res, next) {
  const raw = req.header('Authorization') || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  const user = usersByToken[token];
  if (!user) {
    return res.status(401).json({ error: 'No token provided, authorization denied' });
  }
  req.user = user;
  next();
}

function requireStudentOrParent(req, res, next) {
  if (!req.user || !['student', 'parent'].includes(req.user.userType)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

function request(server, method, path, body, token = 'parent') {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: server.address().port,
        path,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed = {};
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch {
            parsed = { raw };
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const originalLoad = Module._load;

Module._load = function load(requestPath, parent, isMain) {
  if (requestPath === '../models/User') return MockUser;
  if (requestPath === '../models/Booking') return MockBooking;
  if (requestPath === '../middleware/auth') {
    return { auth, requireStudentOrParent };
  }
  if (requestPath === '../services/slack') {
    return {
      notifyAdminPendingUserApproval: async () => {},
      notifyBookingCreated: async () => {},
      sendBookingMessageToStudent: async () => {},
    };
  }
  if (requestPath === '../services/email') {
    return {
      sendBookingConfirmationEmails: async () => ({ status: 'skipped' }),
    };
  }
  return originalLoad.call(this, requestPath, parent, isMain);
};

const app = express();
app.use(express.json());
app.use('/api/auth', require('../backend/routes/auth'));
app.use('/api/users', require('../backend/routes/users'));
app.use('/api/bookings', require('../backend/routes/bookings'));

const server = http.createServer(app);

server.listen(0, async () => {
  try {
    const adminSignup = await request(server, 'POST', '/api/auth/register', {
      email: 'attacker@example.com',
      password: 'password123',
      firstName: 'Bad',
      lastName: 'Actor',
      phone: '555-0000',
      userType: 'admin',
    });
    assert.strictEqual(adminSignup.status, 400, 'public admin registration must be rejected');
    assert.match(adminSignup.body.error, /cannot be self-registered/i);

    await request(server, 'GET', '/api/users/students');
    const browseFilter = captured.userFindFilters.at(-1);
    assert.strictEqual(browseFilter.isVerified, true, 'student browse must require verified students');

    await request(server, 'GET', '/api/users/search?q=math');
    const searchFilter = captured.userFindFilters.at(-1);
    assert.strictEqual(searchFilter.isVerified, true, 'student search must require verified students');

    const bookingCreate = await request(server, 'POST', '/api/bookings', {
      studentId: 'unverified-student',
      date: '2026-06-03',
      startTime: '09:00',
      endTime: '10:00',
      numberOfChildren: 1,
      emergencyContact: '555-1111',
    });
    assert.strictEqual(bookingCreate.status, 404, 'unverified student booking must not be created');
    const bookingStudentFilter = captured.userFindOneFilters.find((filter) => filter._id === 'unverified-student');
    assert.strictEqual(
      bookingStudentFilter.isVerified,
      true,
      'booking creation lookup must require verified students'
    );

    const calendar = await request(
      server,
      'GET',
      '/api/bookings/student/student-1?from=2026-06-01&to=2026-06-30'
    );
    assert.strictEqual(calendar.status, 200, 'student calendar request should succeed');
    const publicBooking = calendar.body.bookings.find((booking) => booking._id === 'public-booking');
    assert(publicBooking, 'expected public booking summary in calendar response');
    assert.strictEqual(publicBooking.parent, undefined, 'public calendar entries must not expose parent IDs');
    assert.strictEqual(
      publicBooking.emergencyContact,
      undefined,
      'public calendar entries must not expose emergency contacts'
    );
    assert.strictEqual(
      publicBooking.specialInstructions,
      undefined,
      'public calendar entries must not expose special instructions'
    );
    assert.deepStrictEqual(
      Object.keys(publicBooking).sort(),
      ['_id', 'date', 'endTime', 'serviceType', 'startTime', 'status'].sort(),
      'public calendar entries should only include availability-safe fields'
    );

    console.log('OK: critical security route regressions are covered.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    Module._load = originalLoad;
    server.close();
  }
});
