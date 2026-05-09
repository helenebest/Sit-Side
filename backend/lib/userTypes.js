const PUBLIC_REGISTRATION_USER_TYPES = ['student', 'parent'];

function isPublicRegistrationUserType(userType) {
  return PUBLIC_REGISTRATION_USER_TYPES.includes(userType);
}

module.exports = {
  PUBLIC_REGISTRATION_USER_TYPES,
  isPublicRegistrationUserType,
};
