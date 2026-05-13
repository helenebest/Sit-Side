const assert = require('node:assert/strict');
const test = require('node:test');

const {
  approvedStudentFilter,
  isApprovedStudent,
} = require('./studentVisibility');

test('approvedStudentFilter requires active, verified students', () => {
  assert.deepEqual(approvedStudentFilter(), {
    userType: 'student',
    isActive: true,
    isVerified: true,
  });
});

test('approvedStudentFilter preserves extra query predicates', () => {
  assert.deepEqual(approvedStudentFilter({ _id: 'student-id' }), {
    _id: 'student-id',
    userType: 'student',
    isActive: true,
    isVerified: true,
  });
});

test('approvedStudentFilter does not allow callers to weaken approval predicates', () => {
  assert.deepEqual(
    approvedStudentFilter({ userType: 'parent', isActive: false, isVerified: false }),
    {
      userType: 'student',
      isActive: true,
      isVerified: true,
    }
  );
});

test('isApprovedStudent only accepts active, verified student records', () => {
  assert.equal(isApprovedStudent({ userType: 'student', isActive: true, isVerified: true }), true);
  assert.equal(isApprovedStudent({ userType: 'student', isActive: true, isVerified: false }), false);
  assert.equal(isApprovedStudent({ userType: 'student', isActive: false, isVerified: true }), false);
  assert.equal(isApprovedStudent({ userType: 'parent', isActive: true, isVerified: true }), false);
  assert.equal(isApprovedStudent(null), false);
});
