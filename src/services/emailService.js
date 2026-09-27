const nodemailer = require("nodemailer");

const { env } = require("../config/env");

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              pass: process.env.SMTP_PASS,
              user: process.env.SMTP_USER,
            }
          : undefined,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  return transporter;
};

const sendEmail = async ({ html, subject, text, to }) => {
  const result = await getTransporter().sendMail({
    from: env.emailFrom,
    html,
    subject,
    text,
    to,
  });

  if (!process.env.SMTP_HOST) {
    console.log(`Development email generated for ${to}: ${subject}`);
  }

  return result;
};

const sendInvitationEmail = ({ email, inviteUrl }) =>
  sendEmail({
    html: `<p>You have been invited to Codex Tracker System.</p><p><a href="${inviteUrl}">Accept invitation</a></p><p>This link expires automatically.</p>`,
    subject: "Your Codex Tracker invitation",
    text: `Accept your invitation: ${inviteUrl}`,
    to: email,
  });

const sendVerificationEmail = ({ email, verifyUrl }) =>
  sendEmail({
    html: `<p>Please verify your email for Codex Tracker System.</p><p><a href="${verifyUrl}">Verify email</a></p>`,
    subject: "Verify your Codex Tracker email",
    text: `Verify your email: ${verifyUrl}`,
    to: email,
  });

const sendPasswordResetEmail = ({ email, resetUrl }) =>
  sendEmail({
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    subject: "Reset your Codex Tracker password",
    text: `Reset your password: ${resetUrl}`,
    to: email,
  });

module.exports = {
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
};
