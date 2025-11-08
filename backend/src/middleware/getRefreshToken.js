const { google } = require("googleapis");
require("dotenv").config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive.file"],
});

console.log("Visita esta URL y autoriza la app:");
console.log(authUrl);

// Una vez autorizado, pega el código aquí:
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question("Ingresa el código de autorización: ", async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  console.log("Tus tokens (usa refresh_token en .env):", tokens);
  readline.close();
});
