const Usuario = require('../Models/usuario_modelo');
const Otp     = require('../Models/otp_modelo');
const admin   = require('../config/firebaseAdmin');
const argon2  = require('argon2');
const mailer  = require('../config/mailer');

// ─── Utilidad: generar OTP de 6 dígitos ──────────────────────────────────
const generarOTP = () =>
  String(Math.floor(100000 + Math.random() * 900000));

// ─── Utilidad: HTML del correo OTP ───────────────────────────────────────
const htmlCorreoOTP = (nombre, codigo) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#1a1d27;padding:32px 40px;text-align:center;">
              <h1 style="color:#4f8ef7;margin:0;font-size:22px;letter-spacing:-0.5px;">
                🔐 Restablecer contraseña
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 12px;">
                Hola <strong>${nombre}</strong>,
              </p>
              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 28px;">
                Recibimos una solicitud para restablecer tu contraseña.
                Usa el siguiente código de verificación. <strong>Expira en 15 minutos.</strong>
              </p>

              <!-- Código OTP grande -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:#1a1d27;
                                border-radius:12px;padding:20px 40px;">
                      <span style="font-family:monospace;font-size:38px;
                                   font-weight:700;letter-spacing:12px;color:#4f8ef7;">
                        ${codigo}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#fff7ed;border:1px solid #fed7aa;
                       border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                      ⚠️ Si no solicitaste este cambio, ignora este correo.
                      Tu contraseña <strong>no será modificada</strong>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;
                       border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Este código expira automáticamente en 15 minutos.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── PASO 1: Solicitar OTP ─────────────────────────────────────────────────
// POST /api/reset-password/solicitar
exports.solicitarOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'El correo es obligatorio.' });

    const emailNorm = email.toLowerCase().trim();

    // Verificar que el usuario exista y esté activo
    const usuario = await Usuario.findOne({ email: emailNorm });
    if (!usuario) {
      // Respuesta genérica para no revelar si el correo existe
      return res.status(200).json({
        message: 'Si ese correo está registrado, recibirás un código en breve.'
      });
    }

    if (usuario.estado === 'BLOQUEADO') {
      return res.status(403).json({ message: 'Tu cuenta está bloqueada. Contacta al administrador.' });
    }

    // Usuarios Google: igual pueden resetear (Firebase lo maneja)
    // Eliminar OTPs anteriores del mismo correo
    await Otp.deleteMany({ email: emailNorm });

    const codigo    = generarOTP();
    const expira_en = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await Otp.create({ email: emailNorm, codigo, expira_en });

    // Enviar correo via Brevo
    await mailer.sendTransacEmail({
      to:          [{ email: emailNorm }],
      sender:      { email: 'siamproject2025@gmail.com', name: 'Sistema Escolar' },
      subject:     '🔐 Tu código para restablecer contraseña',
      htmlContent: htmlCorreoOTP(usuario.username || emailNorm, codigo)
    });

    res.status(200).json({
      message: 'Si ese correo está registrado, recibirás un código en breve.'
    });

  } catch (error) {
    console.error('Error en solicitarOTP:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud.' });
  }
};

// ─── PASO 2: Verificar OTP ────────────────────────────────────────────────
// POST /api/reset-password/verificar
exports.verificarOTP = async (req, res) => {
  try {
    const { email, codigo } = req.body;
    if (!email || !codigo) {
      return res.status(400).json({ message: 'Correo y código son obligatorios.' });
    }

    const emailNorm = email.toLowerCase().trim();

    const otp = await Otp.findOne({ email: emailNorm, codigo, usado: false });

    if (!otp) {
      return res.status(400).json({ message: 'Código incorrecto o no encontrado.' });
    }

    if (new Date() > otp.expira_en) {
      await Otp.deleteOne({ _id: otp._id });
      return res.status(400).json({ message: 'El código ha expirado. Solicita uno nuevo.' });
    }

    // Marcar como usado (no borrar aún, se necesita en paso 3)
    otp.usado = true;
    await otp.save();

    res.status(200).json({ message: 'Código verificado correctamente.', verificado: true });

  } catch (error) {
    console.error('Error en verificarOTP:', error);
    res.status(500).json({ message: 'Error al verificar el código.' });
  }
};

// ─── PASO 3: Cambiar contraseña ───────────────────────────────────────────
// POST /api/reset-password/cambiar
exports.cambiarPassword = async (req, res) => {
  try {
    const { email, codigo, nueva_password } = req.body;

    if (!email || !codigo || !nueva_password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    if (nueva_password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const emailNorm = email.toLowerCase().trim();

    // Re-verificar que el OTP fue usado (validación extra de seguridad)
    const otp = await Otp.findOne({ email: emailNorm, codigo, usado: true });
    if (!otp) {
      return res.status(400).json({ message: 'Sesión de verificación inválida. Vuelve a solicitar el código.' });
    }

    const usuario = await Usuario.findOne({ email: emailNorm });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

    // Actualizar contraseña en Firebase Admin
    await admin.auth().updateUser(usuario.authId, { password: nueva_password });

    // Actualizar hash en MongoDB
    const hashedPassword = await argon2.hash(nueva_password);
    usuario.password_hash         = hashedPassword;
    usuario.debe_cambiar_password = false;
    usuario.intentos_fallidos     = 0;
    usuario.bloqueado_hasta       = null;
    await usuario.save();

    // Limpiar el OTP usado
    await Otp.deleteOne({ _id: otp._id });

    res.status(200).json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });

  } catch (error) {
    console.error('Error en cambiarPassword:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña.', detalle: error.message });
  }
};