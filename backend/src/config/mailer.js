const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

const createTransporter = async () => {
  console.log('📧 [mailer] ── Iniciando createTransporter ──');
  console.log('📧 [mailer] GOOGLE_CLIENT_ID:     ', process.env.GOOGLE_CLIENT_ID     ? `✅ ${process.env.GOOGLE_CLIENT_ID.substring(0,12)}...`     : '❌ undefined');
  console.log('📧 [mailer] GOOGLE_CLIENT_SECRET: ', process.env.GOOGLE_CLIENT_SECRET ? `✅ ${process.env.GOOGLE_CLIENT_SECRET.substring(0,6)}...`    : '❌ undefined');
  console.log('📧 [mailer] GOOGLE_REDIRECT_URI:  ', process.env.GOOGLE_REDIRECT_URI  ? `✅ ${process.env.GOOGLE_REDIRECT_URI}`                        : '❌ undefined');
  console.log('📧 [mailer] GMAIL_REFRESH_TOKEN:  ', process.env.GMAIL_REFRESH_TOKEN  ? `✅ ${process.env.GMAIL_REFRESH_TOKEN.substring(0,10)}...`     : '❌ undefined');
  console.log('📧 [mailer] GMAIL_USER:           ', process.env.GMAIL_USER           ? `✅ ${process.env.GMAIL_USER}`                                 : '❌ undefined');

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  console.log('📧 [mailer] Solicitando access token a Google...');
  let accessToken;
  try {
    const result = await oAuth2Client.getAccessToken();
    accessToken = result.token;
    console.log('📧 [mailer] Access token obtenido: ✅', accessToken.substring(0, 20) + '...');
  } catch (tokenErr) {
    console.error('📧 [mailer] ❌ Error obteniendo access token:');
    console.error('  message:', tokenErr.message);
    console.error('  code:   ', tokenErr.code);
    console.error('  status: ', tokenErr.status);
    console.error('  data:   ', JSON.stringify(tokenErr.response?.data));
    throw tokenErr;
  }

  console.log('📧 [mailer] Creando transporter con host smtp.gmail.com:465 IPv4...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4,
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken
    },
    logger: true,   // ← nodemailer logea cada paso SMTP
    debug: true     // ← muestra comandos SMTP raw
  });

  console.log('📧 [mailer] Verificando conexión SMTP...');
  try {
    await transporter.verify();
    console.log('📧 [mailer] Conexión SMTP verificada: ✅');
  } catch (verifyErr) {
    console.error('📧 [mailer] ❌ Error en verify():');
    console.error('  message:', verifyErr.message);
    console.error('  code:   ', verifyErr.code);
    console.error('  errno:  ', verifyErr.errno);
    console.error('  address:', verifyErr.address);
    console.error('  port:   ', verifyErr.port);
    throw verifyErr;
  }

  console.log('📧 [mailer] Transporter listo ✅');
  return transporter;
};

module.exports = createTransporter;