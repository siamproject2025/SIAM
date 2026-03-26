require('dotenv').config();
const mailer = require('./src/config/mailer');

async function testEmail() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Iniciando test de correo con Brevo...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔵 Node version:    ', process.version);
  console.log('🔵 Platform:        ', process.platform);
  console.log('🔵 Entorno:         ', process.env.NODE_ENV || 'no definido');
  console.log('🔵 Working dir:     ', process.cwd());
  console.log('🔵 BREVO_API_KEY:   ', process.env.BREVO_API_KEY ? `✅ ${process.env.BREVO_API_KEY.substring(0, 8)}...` : '❌ NO definido');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    console.log('🔵 Enviando correo con Brevo...');

    const result = await mailer.sendTransacEmail({
      to: [{ email: 'isadz2001@gmail.com' }],
      sender: { email: 'siamproject2025@gmail.com', name: 'Sistema Escolar' },
      subject: '✅ Prueba Brevo funcionando',
      htmlContent: `
        <h2>🚀 Test desde Railway con Brevo</h2>
        <p>Correo enviado correctamente.</p>
        <p><b>Fecha:</b> ${new Date().toLocaleString()}</p>
        <p><b>Node:</b> ${process.version}</p>
        <p><b>Entorno:</b> ${process.env.NODE_ENV || 'no definido'}</p>
      `
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Correo enviado exitosamente');
    console.log('📨 Message ID:', result.messageId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR en testEmail:');
    console.error('  message: ', error.message);
    if (error.stack) console.error('  stack:   ', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

testEmail();