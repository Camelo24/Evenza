#!/usr/bin/env ts-node

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

(async function sendTest() {
  try {
    const to = process.argv[2] || process.env.TEST_EMAIL_TO;
    if (!to) {
      console.error('Usage: npx ts-node scripts/send-test-email.ts recipient@example.com');
      console.error('Or set TEST_EMAIL_TO in backend/.env');
      process.exit(1);
    }
    const { deliverEmail } = await import('../src/notifications/service');
    console.info('[test-email] attempting deliverEmail for', to);
    await deliverEmail({ to, subject: 'Trufeta test email', body: 'This is a test message from Trufeta. If you do not receive it, check SMTP settings and logs.' });
    console.info('[test-email] deliverEmail resolved — check server logs and email_log table for details');
    process.exit(0);
  } catch (err) {
    console.error('[test-email] failed', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  }
})();
