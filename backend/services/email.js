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

  const port = config.port;
  return nodemailer.createTransport({
    host: config.host,
    port,
    secure: config.secure,
    auth: config.auth,
    requireTLS: port === 587,
    tls: { minVersion: 'TLSv1.2' },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
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

  lines.push('', 'Thank you for using SitSide.');
  return lines.join('\n');
};

const EMAIL_HINTS = {
  smtp_not_configured:
    'Confirmation email was not sent: SMTP is not configured on the API server. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM (e.g. in Vercel → Environment Variables), then redeploy.',
  no_recipient_emails:
    'Confirmation email was not sent: the parent or student record has no email address on file.',
  smtp_send_error:
    'Confirmation email failed to send. Typical causes: wrong SMTP password, EMAIL_FROM not verified in Amazon SES (or your provider), or SES sandbox blocking unverified recipient addresses. Check your API host logs for the exact SMTP error.',
};

const sendBookingConfirmationEmails = async (booking) => {
  const transporter = getTransporter();
  const config = getEmailConfig();
  if (!transporter || !config) {
    return {
      status: 'skipped',
      reason: 'smtp_not_configured',
      hint: EMAIL_HINTS.smtp_not_configured,
    };
  }

  const recipients = [booking?.parent?.email, booking?.student?.email]
    .map((email) => (typeof email === 'string' ? email.trim().toLowerCase() : ''))
    .filter(Boolean);

  const uniqueRecipients = [...new Set(recipients)];
  if (uniqueRecipients.length === 0) {
    return {
      status: 'skipped',
      reason: 'no_recipient_emails',
      hint: EMAIL_HINTS.no_recipient_emails,
    };
  }

  const subject = 'Booking confirmation — SitSide';
  const text = buildBookingConfirmationBody(booking);

  try {
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
    return {
      status: 'sent',
      recipientCount: uniqueRecipients.length,
      hint: null,
    };
  } catch (err) {
    console.error('sendBookingConfirmationEmails SMTP error:', err?.message || err);
    const out = {
      status: 'failed',
      reason: 'smtp_send_error',
      hint: EMAIL_HINTS.smtp_send_error,
    };
    if (process.env.NODE_ENV !== 'production') {
      out.detail = err?.message || String(err);
    }
    return out;
  }
};

module.exports = {
  sendBookingConfirmationEmails,
};
