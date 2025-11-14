// config/gridfs.js - Versión usando SHARP (más rápido y con mejor compresión)
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp'); // <--- USANDO SHARP

// ... (El resto de la configuración de multer y GridFSBucket se mantiene igual)

// Configuración de multer para memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

// Inicializar GridFSBucket
let bucket;
mongoose.connection.once('open', () => {
  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'donacionesFotos'
  });
});

// Función para subir archivo a GridFS con Sharp
const uploadToGridFS = (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(` Archivo original: ${file.originalname}`);
      console.log(` Tamaño original: ${(file.buffer.length / 1024 / 1024).toFixed(2)} MB`);

      const filename = `donacion-${Date.now()}-${file.originalname}`;
      
      // Usar Sharp para procesar
      let imageSharp = sharp(file.buffer);
      const metadata = await imageSharp.metadata();
      
      const width = metadata.width;
      const height = metadata.height;
      console.log(` Dimensiones originales: ${width}x${height}`);

      // *** REQUISITO 1: Redimensión FORZADA a 600x600 píxeles ***
      const TARGET_WIDTH = 600;
      const TARGET_HEIGHT = 600;
      const QUALITY = 60; // Para intentar el < 0.5MB
      const HALF_MB = 0.5 * 1024 * 1024; // 524288 bytes

      imageSharp = imageSharp.resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: 'fill' // Forzar a 600x600, ignorando la proporción (puede distorsionar)
      });
      
      // *** REQUISITO 2: Ajustar calidad para intentar un peso < 0.5MB ***
      // Usamos toBuffer para aplicar la compresión de forma sincrónica con el resto
      let processedBuffer;
      let targetMimeType;
      
      const originalSize = file.buffer.length;

      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        processedBuffer = await imageSharp
          .jpeg({ quality: QUALITY }) // Ajustar calidad JPEG
          .toBuffer();
        targetMimeType = 'image/jpeg';

      } else if (file.mimetype === 'image/png') {
        // Mejor convertir PNG a JPEG para asegurar el límite de peso
        processedBuffer = await imageSharp
          .jpeg({ quality: QUALITY })
          .toBuffer();
        targetMimeType = 'image/jpeg';
        
      } else if (file.mimetype === 'image/webp') {
        processedBuffer = await imageSharp
          .webp({ quality: QUALITY })
          .toBuffer();
        targetMimeType = 'image/webp';
        
      } else {
        // Default a JPEG si es un tipo desconocido
        processedBuffer = await imageSharp
          .jpeg({ quality: QUALITY })
          .toBuffer();
        targetMimeType = 'image/jpeg';
      }

      const processedSize = processedBuffer.length;
      const reduction = ((originalSize - processedSize) / originalSize * 100).toFixed(2);
      const meetsSizeRequirement = processedSize <= HALF_MB;

      console.log(` RESULTADOS PROCESAMIENTO CON SHARP:`);
      console.log(`   Dimensiones Finales: ${TARGET_WIDTH}x${TARGET_HEIGHT} (Forzado)`);
      console.log(`   Tipo de Archivo Final: ${targetMimeType}`);
      console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Procesado: ${(processedSize / 1024 / 1024).toFixed(2)} MB (Límite: 0.5 MB)`);
      console.log(`   Estatus Peso: ${meetsSizeRequirement ? ' OK' : ' EXCEDIDO'}`);
      console.log(`   Reducción: ${reduction}%`);

      // Subir a GridFS
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: { 
          uploadDate: new Date(), 
          contentType: targetMimeType,
          originalSize,
          processedSize,
          compressionRatio: reduction,
          originalDimensions: `${width}x${height}`,
          targetDimensions: `${TARGET_WIDTH}x${TARGET_HEIGHT}`
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

// Función para descargar archivo de GridFS
const downloadFromGridFS = (fileId) => {
  return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

// Función para eliminar archivo de GridFS
const deleteFromGridFS = (fileId) => {
  return bucket.delete(new mongoose.Types.ObjectId(fileId));
};

module.exports = {
  upload,
  uploadToGridFS,
  downloadFromGridFS,
  deleteFromGridFS,
  bucket
};