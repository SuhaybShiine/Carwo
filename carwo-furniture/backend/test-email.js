require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

(async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
    console.log('Length:', (process.env.EMAIL_PASS || '').length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const info = await sendEmail({
      to: process.env.EMAIL_USER,
      subject: 'Test — Carwo Furniture',
      html: '<h1>Test</h1><p>Waa shaqeynayaa!</p>',
    });

    console.log('✅ Email sent:', info.messageId);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();