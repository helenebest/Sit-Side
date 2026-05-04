let nodemailer;
try {
  // Optional dependency. If not installed/configured, email delivery is skipped.
  nodemailer = require('nodemailer');
} catch (error) {
  nodemailer = null;
}

let hasLoggedMissingConfig = false;

const getEmailConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!nodemailer || !host || !Number.isFinite(port) || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from,
  };
};

const getTransporter = () => {
  const config = getEmailConfig();
  if (!config) {
    if (!hasLoggedMissingConfig) {
      console.warn(
        'Booking email confirmations are disabled. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.'
      );
      hasLoggedMissingConfig = true;
    }
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
};

const formatBookingDate = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const buildBookingConfirmationBody = (booking) => {
  const studentName = booking?.student
    ? `${booking.student.firstName || ''} ${booking.student.lastName || ''}`.trim()
    : 'your sitter';
  const parentName = booking?.parent
    ? `${booking.parent.firstName || ''} ${booking.parent.lastName || ''}`.trim()
    : 'the parent';

  const lines = [
    'Your booking request has been created successfully.',
    '',
    `Date: ${formatBookingDate(booking?.date)}`,
    `Time: ${booking?.startTime || '--'} - ${booking?.endTime || '--'}`,
    `Student: ${studentName || 'Unknown'}`,
    `Parent: ${parentName || 'Unknown'}`,
    `Children: ${booking?.numberOfChildren || 0}`,
    `Emergency Contact: ${booking?.emergencyContact || 'Not provided'}`,
    `Status: ${booking?.status || 'pending'}`,
  ];

  if (booking?.specialInstructions) {
    lines.push(`Special Instructions: ${booking.specialInstructions}`);
  }

  if (booking?.totalAmount != null) {
    lines.push(`Estimated Total: $${booking.totalAmount}`);
  }

  lines.push('', 'Thank you for using Windward Connect.');
  return lines.join('\n');
};

const sendBookingConfirmationEmails = async (booking) => {
  const transporter = getTransporter();
  const config = getEmailConfig();
  if (!transporter || !config) {
    return { sent: false, skipped: true };
  }

  const recipients = [booking?.parent?.email, booking?.student?.email]
    .map((email) => (typeof email === 'string' ? email.trim().toLowerCase() : ''))
    .filter(Boolean);

  const uniqueRecipients = [...new Set(recipients)];
  if (uniqueRecipients.length === 0) {
    return { sent: false, skipped: true };
  }

  const subject = 'Booking confirmation - Windward Connect';
  const text = buildBookingConfirmationBody(booking);

  await Promise.all(
    uniqueRecipients.map((to) =>
      transporter.sendMail({
        from: config.from,
        to,
        subject,
        text,
      })
    )
  );

  return { sent: true, recipients: uniqueRecipients };
};

module.exports = {
  sendBookingConfirmationEmails,
};
