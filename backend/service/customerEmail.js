const nodemailer = require('nodemailer');

const sendVerificationCode = async (email, code) => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) return false;
    const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    await transport.sendMail({
        from: MAIL_FROM,
        to: email,
        subject: 'Verify your K Star Light email',
        text: `Your verification code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`
    });
    return true;
};

module.exports = { sendVerificationCode };
