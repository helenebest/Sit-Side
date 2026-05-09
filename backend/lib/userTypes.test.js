const assert = require('node:assert/strict');
const test = require('node:test');

const {
  PUBLIC_REGISTRATION_USER_TYPES,
  isPublicRegistrationUserType,
} = require('./userTypes');

test('public registration only allows student and parent accounts', () => {
  assert.deepEqual(PUBLIC_REGISTRATION_USER_TYPES, ['student', 'parent']);
  assert.equal(isPublicRegistrationUserType('student'), true);
  assert.equal(isPublicRegistrationUserType('parent'), true);
  assert.equal(isPublicRegistrationUserType('admin'), false);
  assert.equal(isPublicRegistrationUserType(undefined), false);
});
