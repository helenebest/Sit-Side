const APPROVED_STUDENT_FILTER = Object.freeze({
  userType: 'student',
  isActive: true,
  isVerified: true,
});

function approvedStudentFilter(extra = {}) {
  return {
    ...extra,
    ...APPROVED_STUDENT_FILTER,
  };
}

function isApprovedStudent(student) {
  return Boolean(
    student &&
      student.userType === 'student' &&
      student.isActive === true &&
      student.isVerified === true
  );
}

module.exports = {
  approvedStudentFilter,
  isApprovedStudent,
};
