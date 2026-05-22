const { SERVICE_TYPES } = require('../constants/serviceOfferings');

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function resolveBookingServiceType(body = {}) {
  const hasServiceType = hasOwn(body, 'serviceType');
  const serviceType = hasServiceType
    ? (typeof body.serviceType === 'string' ? body.serviceType.trim() : '')
    : 'babysitter';

  if (!SERVICE_TYPES.includes(serviceType)) {
    return { error: 'Invalid service type' };
  }

  if (hasOwn(body, 'tutoringOffering') && serviceType !== 'tutor') {
    return { error: 'Tutoring offering requires tutor service type' };
  }

  if (hasOwn(body, 'coachingOffering') && serviceType !== 'coach') {
    return { error: 'Coaching offering requires coach service type' };
  }

  return { serviceType };
}

module.exports = {
  resolveBookingServiceType,
};
