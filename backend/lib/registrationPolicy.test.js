const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PUBLIC_REGISTRATION_USER_TYPES,
  isPublicRegistrationUserType,
} = require('./registrationPolicy');

test('public registration allows only student and parent accounts', () => {
  assert.deepEqual(PUBLIC_REGISTRATION_USER_TYPES, ['student', 'parent']);
  assert.equal(isPublicRegistrationUserType('student'), true);
  assert.equal(isPublicRegistrationUserType('parent'), true);
  assert.equal(isPublicRegistrationUserType('admin'), false);
});
