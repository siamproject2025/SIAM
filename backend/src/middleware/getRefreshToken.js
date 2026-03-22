const { google } = require("googleapis");
require("dotenv").config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Agrega los scopes de Gmail junto con Drive
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // 🔥 FORZAR refresh_token SIEMPRE
  scope: [
   // "https://www.googleapis.com/auth/drive.file",
    "https://mail.google.com/"  // 🔥 Scope correcto para Nodemailer (SMTP)
    // También puedes usar "https://www.googleapis.com/auth/gmail.compose"
    // o "https://www.googleapis.com/auth/gmail.modify" según necesidades
  ],
});

console.log("Visita esta URL y autoriza la app:");
console.log(authUrl);

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question("Ingresa el código de autorización: ", async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  console.log("Tus tokens (guarda refresh_token en .env):", tokens);
  readline.close();
});