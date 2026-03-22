const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Mantiene la misma interfaz que nodemailer para no cambiar el resto del código
const transporter = {
  sendMail: async ({ from, to, subject, html }) => {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html
    });
    if (error) throw new Error(error.message);
    return data;
  }
};

module.exports = transporter;

RESEND_API_KEY=re_xxxxxxxxxxxxxxxx