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

/**
 * Notify admins that a student/parent account is pending approval.
 */
const notifyAdminPendingUserApproval = async (user) => {
  if (!isSlackConfigured()) return;
  if (!defaultChannel) return;

  const lines = [
    '🆕 *Account pending approval*',
    '',
    `*Name:* ${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    `*Email:* ${user?.email || 'N/A'}`,
    `*Role:* ${user?.userType || 'N/A'}`,
    `*Created:* ${user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}`,
  ];

  try {
    await slackClient.chat.postMessage({
      channel: defaultChannel,
      text: lines.join('\n'),
    });
  } catch (error) {
    console.error('Error sending admin approval Slack message:', error);
  }
};

module.exports = {
  isSlackConfigured,
  notifyBookingCreated,
  sendBookingMessageToStudent,
  notifyAdminPendingUserApproval,
};
