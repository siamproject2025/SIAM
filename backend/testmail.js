require('dotenv').config();
const createTransporter = require('./src/config/mailer');

async function testEmail() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Iniciando test de correo...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔵 Node version:    ', process.version);
  console.log('🔵 Platform:        ', process.platform);
  console.log('🔵 Entorno:         ', process.env.NODE_ENV || 'no definido');
  console.log('🔵 Working dir:     ', process.cwd());
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    console.log('🔵 Llamando createTransporter()...');
    const transporter = await createTransporter();
    console.log('✅ Transporter creado correctamente');

    console.log('🔵 Llamando sendMail()...');
    const info = await transporter.sendMail({
      from: `"Sistema Escolar" <${process.env.GMAIL_USER}>`,
      to: 'isadz2001@gmail.com',
      subject: '✅ Prueba diagnóstico Railway',
      html: `
        <h2>🚀 Test desde Railway</h2>
        <p>Correo enviado correctamente.</p>
        <p><b>Fecha:</b> ${new Date().toLocaleString()}</p>
        <p><b>Node:</b> ${process.version}</p>
        <p><b>Entorno:</b> ${process.env.NODE_ENV || 'no definido'}</p>
      `,
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Correo enviado exitosamente');
    console.log('📨 Message ID: ', info.messageId);
    console.log('📨 Response:   ', info.response);
    console.log('📨 Accepted:   ', info.accepted);
    console.log('📨 Rejected:   ', info.rejected);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR en testEmail:');
    console.error('  message: ', error.message);
    console.error('  code:    ', error.code);
    console.error('  errno:   ', error.errno);
    console.error('  syscall: ', error.syscall);
    console.error('  address: ', error.address);
    console.error('  port:    ', error.port);
    if (error.response) console.error('  response:', error.response);
    if (error.stack)    console.error('  stack:   ', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

testEmail();