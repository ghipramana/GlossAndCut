const nodemailer = require('nodemailer');

// Configure the transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendResetEmail = async (toEmail, token) => {
  const resetLink = `http://localhost:3000/?token=${token}`;
  
  const mailOptions = {
    from: `"Gloss & Cut" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset Password Anda - Gloss & Cut',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #ff9800; text-align: center;">Gloss & Cut</h2>
        <p>Halo,</p>
        <p>Anda baru saja meminta untuk mereset password akun Gloss & Cut Anda.</p>
        <p>Silakan klik tombol di bawah ini untuk membuat password baru:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #ff9800; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>Atau copy dan paste link berikut di browser Anda:</p>
        <p style="word-break: break-all; color: #555;">${resetLink}</p>
        <p style="margin-top: 30px; font-size: 12px; color: #888;">
          Jika Anda tidak merasa meminta reset password ini, abaikan saja email ini. Link ini hanya berlaku selama 15 menit.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendResetEmail
};
