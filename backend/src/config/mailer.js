// mailer.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

module.exports = new SibApiV3Sdk.TransactionalEmailsApi();