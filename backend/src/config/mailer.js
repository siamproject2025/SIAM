const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

const createTransporter = async () => {
  console.log('📧 [mailer] Iniciando createTransporter...');
  
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  console.log('📧 [mailer] Obteniendo access token...');
  const accessToken = await oAuth2Client.getAccessToken();
  console.log('📧 [mailer] Access token obtenido ✅');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token
    }
  });

  console.log('📧 [mailer] Transporter creado ✅');
  return transporter;
};

module.exports = createTransporter;