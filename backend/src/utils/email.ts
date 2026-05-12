import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Log transporter creation (without credentials)
console.log(`[Email] SMTP transporter configured for ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${process.env.SMTP_PORT || 587}`);

export const sendVerificationEmail = async (email: string, token: string) => {
  // Log attempt (hash email for privacy in logs)
  const emailHash = Buffer.from(email).toString('base64');
  console.log(`[Email] Attempting to send verification email to hash:${emailHash}`);

  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${token}`;
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Verifique seu e-mail - Sistema de Gestão de Frota',
    html: `
      <h1>Bem-vindo ao Sistema de Gestão de Frota</h1>
      <p>Obrigado por se registrar. Por favor, clique no link abaixo para verificar seu e-mail:</p>
      <a href="${verificationUrl}">Verificar E-mail</a>
      <p>Se você não criou esta conta, ignore este e-mail.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Verification email sent successfully to hash:${emailHash}`);
  } catch (error) {
    console.error(`[Email] Failed to send verification email to hash:${emailHash}:`, error);
    throw error; // Re-throw so the caller can handle it
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  // Log attempt (hash email for privacy in logs)
  const emailHash = Buffer.from(email).toString('base64');
  console.log(`[Email] Attempting to send password reset email to hash:${emailHash}`);

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Redefinição de senha - Sistema de Gestão de Frota',
    html: `
      <h1>Redefinição de senha</h1>
      <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para definir uma nova senha:</p>
      <a href="${resetUrl}">Redefinir Senha</a>
      <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Password reset email sent successfully to hash:${emailHash}`);
  } catch (error) {
    console.error(`[Email] Failed to send password reset email to hash:${emailHash}:`, error);
    throw error; // Re-throw so the caller can handle it
  }
};