const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const name = email.split('@')[0];

  try {
    await transporter.sendMail({
      from: '"Lumenary" <' + process.env.GMAIL_USER + '>',
      to: process.env.GMAIL_USER,
      subject: 'New Lumenary beta signup',
      text: email + ' signed up for the Lumenary private beta.'
    });

    await transporter.sendMail({
      from: '"Lumenary" <' + process.env.GMAIL_USER + '>',
      to: email,
      subject: 'Welcome to Lumenary’s Private Beta',
      text: [
        'Hi ' + name + ',',
        '',
        'Thank you for joining Lumenary\'s private beta. We\'re delighted to welcome you to a growing community of Canadian businesses that are putting their idle treasury to work — compliantly, securely, and without the complexity.',
        '',
        'Here is what you can expect next:',
        '',
        '  1. Our team will review your registration and reach out within 1–2 business days with your onboarding details.',
        '  2. You will receive early access to the platform at no cost — no platform fee, no subscription, and no lock-up during the beta period.',
        '  3. A dedicated onboarding specialist will walk you through your first deposit, dashboard setup, and tax configuration at your convenience.',
        '',
        'If you have any questions, reply to this email or reach us at lumenarysaas@gmail.com.',
        '',
        'We look forward to helping your business earn more on the cash it isn\'t using.',
        '',
        'Warm regards,',
        'The Lumenary Team',
        'Montréal, Canada',
        '',
        '---',
        'Lumenary is a non-custodial treasury platform for Canadian SMEs. Yields are variable and not guaranteed. This message was sent because you signed up for the Lumenary private beta.'
      ].join('\n')
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
};
