const { WebClient } = require('@slack/web-api');

// Initialize Slack client if token is provided
const slackToken = process.env.SLACK_BOT_TOKEN;
const defaultChannel = process.env.SLACK_DEFAULT_CHANNEL;

let slackClient = null;

if (slackToken) {
  slackClient = new WebClient(slackToken);
} else {
  console.warn('SLACK_BOT_TOKEN is not set. Slack notifications are disabled.');
}

const isSlackConfigured = () => !!slackClient;

/** Slack member ID to DM when a student/parent account needs admin approval. */
const ADMIN_APPROVAL_SLACK_USER_ID =
  process.env.SLACK_ADMIN_NOTIFY_USER_ID || 'U0ANZDQ6K89';

/**
 * Notify the site administrator that a new student or parent account is awaiting approval.
 */
const notifyAdminPendingUserApproval = async (userDoc) => {
  if (!slackClient) {
    console.warn('Slack not configured; skipping admin approval notification.');
    return;
  }

  const adminRef =
    process.env.SLACK_ADMIN_REFERENCE_EMAIL || 'helbybest@gmail.com';

  let channel = ADMIN_APPROVAL_SLACK_USER_ID;
  try {
    const opened = await slackClient.conversations.open({
      users: ADMIN_APPROVAL_SLACK_USER_ID,
    });
    if (opened.ok && opened.channel && opened.channel.id) {
      channel = opened.channel.id;
    }
  } catch (error) {
    console.error('Slack conversations.open (admin notify) failed:', error.message);
  }

  const type = userDoc.userType || 'user';
  const name = `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim() || 'Unknown';
  const text = [
    '🔐 *Account pending administrator approval*',
    '',
    `A new *${type}* registered and requires verification before full access.`,
    '',
    `*Name:* ${name}`,
    `*Email:* ${userDoc.email || 'N/A'}`,
    `*Admin contact:* ${adminRef}`,
    `*User ID:* ${userDoc._id}`,
    '',
    'Please review and approve in the admin panel when due diligence is complete.',
  ].join('\n');

  try {
    await slackClient.chat.postMessage({
      channel,
      text,
    });
  } catch (error) {
    console.error('Error sending Slack admin approval message:', error);
  }
};

/**
 * Post a message to a Slack user (DM) or channel.
 * If a student has a slackUserId, we DM them directly.
 * Otherwise we fall back to SLACK_DEFAULT_CHANNEL if configured.
 */
const postSlackMessage = async ({ student, text }) => {
  if (!slackClient) return;

  const target = student?.slackUserId || defaultChannel;
  if (!target) {
    console.warn('No slackUserId on student and SLACK_DEFAULT_CHANNEL is not set. Skipping Slack message.');
    return;
  }

  try {
    await slackClient.chat.postMessage({
      channel: target,
      text,
    });
  } catch (error) {
    console.error('Error sending Slack message:', error);
  }
};

/**
 * Notify the student (and/or ops channel) that a new booking was created.
 * Optionally includes an initial message from the parent to the student.
 */
const notifyBookingCreated = async (booking, parentMessage) => {
  if (!isSlackConfigured()) return;

  const student = booking.student;
  const parent = booking.parent;

  const baseLines = [
    `📅 *New booking request*`,
    ``,
    `*Student:* ${student?.firstName || ''} ${student?.lastName || ''}`.trim(),
    `*Parent:* ${parent?.firstName || ''} ${parent?.lastName || ''}`.trim(),
    `*Date:* ${booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}`,
    `*Time:* ${booking.startTime || 'N/A'} – ${booking.endTime || 'N/A'}`,
    `*Children:* ${booking.numberOfChildren} (ages: ${
      Array.isArray(booking.childrenAges) && booking.childrenAges.length
        ? booking.childrenAges.join(', ')
        : 'not specified'
    })`,
    `*Total:* $${booking.totalAmount?.toFixed(2) ?? '0.00'}`,
  ];

  if (booking.specialInstructions) {
    baseLines.push('', `*Special instructions:* ${booking.specialInstructions}`);
  }

  if (parentMessage) {
    baseLines.push('', `*Message from parent:* ${parentMessage}`);
  }

  baseLines.push('', `Booking ID: ${booking._id}`);

  const text = baseLines.join('\n');

  await postSlackMessage({ student, text });
};

/**
 * Send a standalone message from a parent to a student about a booking.
 */
const sendBookingMessageToStudent = async (booking, parent, message) => {
  if (!isSlackConfigured()) return;
  if (!message || !message.trim()) return;

  const student = booking.student;

  const lines = [
    `💬 *New message from parent*`,
    ``,
    `*Parent:* ${parent?.firstName || ''} ${parent?.lastName || ''}`.trim(),
    `*Booking date:* ${booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}`,
    `*Time:* ${booking.startTime || 'N/A'} – ${booking.endTime || 'N/A'}`,
    ``,
    `${message.trim()}`,
    ``,
    `Booking ID: ${booking._id}`,
  ];

  const text = lines.join('\n');

  await postSlackMessage({ student, text });
};

module.exports = {
  isSlackConfigured,
  notifyBookingCreated,
  sendBookingMessageToStudent,
  notifyAdminPendingUserApproval,
};

