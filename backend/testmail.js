require('dotenv').config();
const createTransporter = require('./src/config/mailer');

async function testEmail() {
  console.log('📧 Probando correo...\n');

  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: `"Sistema Escolar" <${process.env.GMAIL_USER}>`,
        to: 'isadz2001@gmail.com',
      subject: '✅ Prueba OAuth2 funcionando',
      html: `
        <h2>🚀 Todo funcionando!</h2>
        <p>Tu configuración OAuth2 con Gmail está correcta.</p>
        <p><b>Fecha:</b> ${new Date().toLocaleString()}</p>
      `,
    });

    console.log('✅ Correo enviado!');
    console.log('📨 Message ID:', info.messageId);

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error.message);
    if (error.response) console.error(error.response);
  }
}

testEmail();