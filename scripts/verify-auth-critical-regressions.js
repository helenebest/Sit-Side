#!/usr/bin/env node

const assert = require('assert');
const Module = require('module');

let userConstructed = false;

class MockUser {
  constructor(data) {
    userConstructed = true;
    Object.assign(this, data);
    this._id = 'mock-user-id';
    this.isVerified = Boolean(data.isVerified);
    this.rating = 0;
    this.reviewCount = 0;
  }

  async save() {
    throw new Error('Admin self-registration should be rejected before save');
  }
}

MockUser.findOne = async () => null;

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (parent?.filename?.endsWith('/backend/routes/auth.js')) {
    if (request === '../models/User') {
      return MockUser;
    }
    if (request === '../services/slack') {
      return { notifyAdminPendingUserApproval: async () => {} };
    }
  }
  return originalLoad.apply(this, arguments);
};

const authRouter = require('../backend/routes/auth');
Module._load = originalLoad;

function getRouteHandler(path, method, stackIndex = -1) {
  const layer = authRouter.stack.find((entry) => entry.route?.path === path);
  assert(layer, `Expected route ${path} to exist`);
  const routeStack = layer.route.stack.filter((entry) => entry.method === method);
  assert(routeStack.length > 0, `Expected ${method.toUpperCase()} ${path} handler`);
  const index = stackIndex < 0 ? routeStack.length + stackIndex : stackIndex;
  assert(routeStack[index], `Expected handler index ${stackIndex} for ${method.toUpperCase()} ${path}`);
  return routeStack[index].handle;
}

async function invoke(handler, req) {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  await handler(req, res, (error) => {
    throw error || new Error('Unexpected next() call');
  });
  return res;
}

async function verifyAdminRegistrationRejected() {
  const register = getRouteHandler('/register', 'post');
  const res = await invoke(register, {
    body: {
      email: 'attacker@example.com',
      password: 'not-a-real-secret',
      firstName: 'Bad',
      lastName: 'Actor',
      phone: '555-0000',
      userType: 'admin',
    },
  });

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error, 'Invalid user type');
  assert.strictEqual(userConstructed, false, 'Admin registration must not create a User');
}

async function verifyTokenCheckReturnsFullProfile() {
  const verify = getRouteHandler('/verify', 'get');
  const res = await invoke(verify, {
    user: {
      _id: 'student-id',
      email: 'student@example.com',
      firstName: 'Stu',
      lastName: 'Dent',
      phone: '555-1111',
      userType: 'student',
      grade: 11,
      school: 'Central High',
      bio: 'Experienced sitter',
      hourlyRate: 20,
      useSameRateForAllServices: false,
      hourlyRateTutor: 30,
      hourlyRateCoach: 25,
      tutoringOfferings: [{ subject: 'Math', detail: '' }],
      coachingOfferings: [{ sport: 'Soccer', detail: '' }],
      availability: { monday: { morning: true, afternoon: false, evening: true } },
      unavailableDates: [new Date('2026-06-01T00:00:00.000Z')],
      slackUserId: 'U123',
      isVerified: true,
      isActive: true,
      rating: 4.8,
      reviewCount: 12,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  });

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.valid, true);
  assert.deepStrictEqual(res.body.user.tutoringOfferings, [{ subject: 'Math', detail: '' }]);
  assert.deepStrictEqual(res.body.user.coachingOfferings, [{ sport: 'Soccer', detail: '' }]);
  assert.strictEqual(res.body.user.useSameRateForAllServices, false);
  assert.strictEqual(res.body.user.hourlyRateTutor, 30);
  assert.strictEqual(res.body.user.hourlyRateCoach, 25);
  assert.strictEqual(res.body.user.slackUserId, 'U123');
}

async function main() {
  await verifyAdminRegistrationRejected();
  await verifyTokenCheckReturnsFullProfile();
  console.log('Auth critical regression checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
