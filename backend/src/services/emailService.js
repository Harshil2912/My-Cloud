'use strict';

// services/emailService.js
// Nodemailer wrapper for transactional email (account verification, etc.)
// Only used when EMAIL_VERIFICATION_REQUIRED=true.

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendVerificationEmail(toEmail, verifyUrl) {
  const mail = getTransporter();
  await mail.sendMail({
    from:    process.env.SMTP_FROM || 'Pvt Cloud <noreply@pvtcloud.local>',
    to:      toEmail,
    subject: 'Verify your Pvt Cloud account',
    text:    `Click the link to verify your account:\n\n${verifyUrl}\n\nExpires in 24 hours.`,
    html:    `<p>Click the link to verify your account:</p>
              <p><a href="${verifyUrl}">${verifyUrl}</a></p>
              <p>This link expires in 24 hours.</p>`,
  });
}

module.exports = {
  sendVerificationEmail,
  isEnabled: () => process.env.EMAIL_VERIFICATION_REQUIRED === 'true',
};
