// middleware/uploadImage.js  (antes config/gridfs.js)
// ============================================================
// CAMBIO: se agrega `uploadMatricula` — una configuración de
// multer separada que acepta imágenes (perfil) Y documentos
// (PDF, JPG, PNG) para las rutas de matrícula.
// El `upload` original NO se toca — sigue siendo solo imágenes.
// ============================================================
const mongoose    = require('mongoose');
const { GridFSBucket } = require('mongodb');
const multer      = require('multer');
const path        = require('path');
const sharp       = require('sharp');

// ── Almacenamiento en memoria (igual que antes) ──────────────
const storage = multer.memoryStorage();

// ── upload ORIGINAL — solo imágenes (sin cambios) ────────────
// Se mantiene igual para no romper ninguna otra ruta del sistema.
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'), false);
        }
    }
});

// ── uploadMatricula — imágenes + documentos PDF/JPG/PNG ──────
// Usado ÚNICAMENTE en las rutas de matrícula (POST / y PUT /:id).
// Acepta dos campos:
//   - 'imagen'     (1 archivo)  → foto de perfil del alumno
//   - 'documentos' (hasta 6)    → docs de matrícula que van a Drive
const TIPOS_PERMITIDOS_DOCS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
];

const uploadMatricula = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB (docs pueden ser más grandes)
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'imagen') {
            // Campo de foto de perfil: solo imágenes
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('La foto de perfil debe ser una imagen'), false);
            }
        } else if (file.fieldname === 'documentos') {
            // Campo de documentos de matrícula: imágenes y PDF
            if (TIPOS_PERMITIDOS_DOCS.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Los documentos deben ser PDF, JPG o PNG'), false);
            }
        } else {
            // Cualquier otro campo no reconocido: rechazar
            cb(new Error(`Campo de archivo no reconocido: ${file.fieldname}`), false);
        }
    }
}).fields([
    { name: 'imagen',     maxCount: 1 },
    { name: 'documentos', maxCount: 6 },
]);

// ── GridFSBucket (igual que antes) ──────────────────────────
let bucket;
mongoose.connection.once('open', () => {
    bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'donacionesFotos'
    });
});

// ── Función para subir imagen a GridFS con Sharp ─────────────
const uploadToGridFS = (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(` Archivo original: ${file.originalname}`);
            console.log(` Tamaño original: ${(file.buffer.length / 1024 / 1024).toFixed(2)} MB`);

            const filename = `donacion-${Date.now()}-${file.originalname}`;

            let imageSharp = sharp(file.buffer);
            const metadata = await imageSharp.metadata();

            const width  = metadata.width;
            const height = metadata.height;
            console.log(` Dimensiones originales: ${width}x${height}`);

            const TARGET_WIDTH  = 600;
            const TARGET_HEIGHT = 600;
            const QUALITY       = 60;
            const HALF_MB       = 0.5 * 1024 * 1024;

            imageSharp = imageSharp.resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'fill' });

            let processedBuffer;
            let targetMimeType;
            const originalSize = file.buffer.length;

            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
                processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
                targetMimeType  = 'image/jpeg';
            } else if (file.mimetype === 'image/png') {
                processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
                targetMimeType  = 'image/jpeg';
            } else if (file.mimetype === 'image/webp') {
                processedBuffer = await imageSharp.webp({ quality: QUALITY }).toBuffer();
                targetMimeType  = 'image/webp';
            } else {
                processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
                targetMimeType  = 'image/jpeg';
            }

            const processedSize = processedBuffer.length;
            const reduction     = ((originalSize - processedSize) / originalSize * 100).toFixed(2);

            console.log(` RESULTADOS PROCESAMIENTO CON SHARP:`);
            console.log(`   Dimensiones Finales: ${TARGET_WIDTH}x${TARGET_HEIGHT}`);
            console.log(`   Tipo Final: ${targetMimeType}`);
            console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Procesado: ${(processedSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Reducción: ${reduction}%`);

            const uploadStream = bucket.openUploadStream(filename, {
                metadata: {
                    uploadDate:          new Date(),
                    contentType:         targetMimeType,
                    originalSize,
                    processedSize,
                    compressionRatio:    reduction,
                    originalDimensions:  `${width}x${height}`,
                    targetDimensions:    `${TARGET_WIDTH}x${TARGET_HEIGHT}`
                }
            });

            uploadStream.end(processedBuffer);
            uploadStream.on('finish', (file) => {
                console.log(` Archivo subido: ${file._id}`);
                resolve(file);
            });
            uploadStream.on('error', reject);

        } catch (err) {
            console.error(' Error en procesamiento:', err);
            reject(err);
        }
    });
};

// ── Helpers GridFS ───────────────────────────────────────────
const downloadFromGridFS = (fileId) => {
    return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

const deleteFromGridFS = (fileId) => {
    return bucket.delete(new mongoose.Types.ObjectId(fileId));
};

module.exports = {
    upload,           // original — solo imágenes (resto del sistema)
    uploadMatricula,  // NUEVO — imágenes + PDF para rutas de matrícula
    uploadToGridFS,
    downloadFromGridFS,
    deleteFromGridFS,
    bucket
};