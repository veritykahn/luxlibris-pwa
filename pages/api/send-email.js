// pages/api/send-email.js - Multi-account Zoho SMTP email sending
import nodemailer from 'nodemailer';

const EMAIL_ACCOUNTS = {
  support: {
    email: 'support@luxlibris.org',
    name: 'Lux Libris Support',
    password: process.env.ZOHO_SUPPORT_PASSWORD
  },
  partnerships: {
    email: 'partnerships@luxlibris.org', 
    name: 'Lux Libris Partnerships',
    password: process.env.ZOHO_PARTNERSHIPS_PASSWORD
  },
  inquiries: {
    email: 'inquiries@luxlibris.org',
    name: 'Lux Libris Inquiries', 
    password: process.env.ZOHO_INQUIRIES_PASSWORD
  },
  noreply: {
    email: 'noreply@luxlibris.org',
    name: 'Lux Libris',
    password: process.env.ZOHO_NOREPLY_PASSWORD
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, text, html, fromAccount = 'support' } = req.body;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, and text/html' });
  }

  const account = EMAIL_ACCOUNTS[fromAccount];
  if (!account) {
    return res.status(400).json({ error: 'Invalid fromAccount. Use: support, partnerships, inquiries, or noreply' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: account.email,
        pass: account.password,
      },
    });

    const info = await transporter.sendMail({
      from: `"${account.name}" <${account.email}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });

    console.log(`Email sent from ${account.email}:`, info.messageId);
    res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}