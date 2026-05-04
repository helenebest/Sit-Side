#!/usr/bin/env node
/**
 * Create or update an admin user in MongoDB.
 *
 * Run from repo root (with Mongo env vars set, same as Vercel / local API):
 *
 *   ADMIN_PASSWORD='your-secure-password' npm run seed:admin
 *
 * Optional: ADMIN_EMAIL (default admin@sitside.com), ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_PHONE
 *
 * Do not commit real passwords; pass ADMIN_PASSWORD only in your shell or .env.local (gitignored).
 */

function loadEnvFiles() {
  let dotenv;
  try {
    dotenv = require('dotenv');
  } catch {
    return;
  }
  const path = require('path');
  dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

loadEnvFiles();

const mongoose = require('../backend/mongoose');
const { connectToDatabase } = require('../api/lib/db');
const User = require('../backend/models/User');

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !String(password).trim()) {
    console.error(
      'Missing ADMIN_PASSWORD.\nExample:\n  ADMIN_PASSWORD="your-secure-password" npm run seed:admin\n\nOptional: ADMIN_EMAIL (default admin@sitside.com)'
    );
    process.exit(1);
  }

  await connectToDatabase();

  const email = (process.env.ADMIN_EMAIL || 'admin@sitside.com').toLowerCase().trim();
  const firstName = (process.env.ADMIN_FIRST_NAME || 'Admin').trim();
  const lastName = (process.env.ADMIN_LAST_NAME || 'User').trim();
  const phone = (process.env.ADMIN_PHONE || '000-000-0000').trim();

  let user = await User.findOne({ email });
  if (user) {
    user.password = password;
    user.userType = 'admin';
    user.isVerified = true;
    user.isActive = true;
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    await user.save();
    console.log('Updated existing user to admin:', email);
  } else {
    user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      userType: 'admin',
      isVerified: true,
      isActive: true,
    });
    await user.save();
    console.log('Created admin user:', email);
  }

  await mongoose.disconnect();
  console.log('Done. You can sign in at /login with that email and password.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
