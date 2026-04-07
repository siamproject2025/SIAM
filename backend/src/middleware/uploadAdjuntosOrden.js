const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads si no existe
const uploadDir = path.join(__dirname, '../../uploads/ordenes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: adjunto-timestamp-filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const originalName = path.parse(file.originalname).name;
    const extension = path.extname(file.originalname);
    
    const filename = `adjunto-${timestamp}-${randomStr}${extension}`;
    cb(null, filename);
  }
});

// Tipos MIME permitidos
const TIPOS_PERMITIDOS = {
  'application/pdf': 'PDF',
  'image/jpeg': 'IMG',
  'image/jpg': 'IMG',
  'image/png': 'IMG',
  'image/webp': 'IMG',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOC',
  'application/vnd.ms-excel': 'DOC',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'DOC'
};

// Configuración de multer para adjuntos
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB máximo por archivo
    files: 5 // Máximo 5 archivos
  },
  fileFilter: (req, file, cb) => {
    // Validar tipo MIME
    if (!TIPOS_PERMITIDOS[file.mimetype]) {
      return cb(new Error('Tipo de archivo no permitido. Solo PDF, imágenes y documentos Word/Excel'), false);
    }

    // Validar extensión también
    const ext = path.extname(file.originalname).toLowerCase();
    const extensionesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.xls', '.xlsx'];
    
    if (!extensionesPermitidas.includes(ext)) {
      return cb(new Error('Extensión de archivo no permitida'), false);
    }

    cb(null, true);
  }
});

// Exportar uploadAdjuntos.fields() para procesar tanto archivos como campos de texto
const uploadAdjuntos = upload.fields([
  { name: 'datos', maxCount: 1 },    // Campo de texto JSON (1 máximo)
  { name: 'adjuntos', maxCount: 5 }  // Array de archivos (5 máximo)
]);

// Middleware para procesar archivos y prepararlos para guardar
const procesarAdjuntos = (req, res, next) => {
  try {
    console.log('📦 procesarAdjuntos ejecutado');
    console.log('   req.files keys:', Object.keys(req.files || {}));
    
    // Con multer.fields(), req.files es un objeto con propiedades 'datos' y 'adjuntos'
    const archivos = req.files?.adjuntos || [];
    console.log(`   Archivos adjuntos encontrados: ${archivos.length}`);
    
    if (!archivos || archivos.length === 0) {
      req.adjuntosProcessados = [];
      return next();
    }

    req.adjuntosProcessados = archivos.map(file => ({
      nombre: file.originalname.replace(/\.[^/.]+$/, ''), // Nombre sin extensión
      tipo: TIPOS_PERMITIDOS[file.mimetype] || 'DOC',
      ruta: `/uploads/ordenes/${file.filename}`, // Ruta relativa para guardar en BD
      tamano: file.size,
      fecha_carga: new Date()
    }));

    console.log(`   ✅ ${req.adjuntosProcessados.length} adjunto(s) procesado(s)`);
    next();
  } catch (error) {
    console.error('❌ Error procesando adjuntos:', error);
    res.status(400).json({ error: 'Error procesando archivos adjuntos' });
  }
};

// Middleware para manejar errores de multer
const manejarErroresMulter = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'Archivo muy grande. Máximo 10 MB por archivo' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Demasiados archivos. Máximo 5 archivos' });
    }
    return res.status(400).json({ error: err.message || 'Error en la carga de archivos' });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'Error desconocido en la carga' });
  }
  next();
};

module.exports = {
  uploadAdjuntos,  // Ya es .fields(), no aplicar .array()
  procesarAdjuntos,
  manejarErroresMulter,
  TIPOS_PERMITIDOS
};
