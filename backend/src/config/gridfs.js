const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

// Crear conexión para GridFS
const conn = mongoose.connection;

let gfsBucket;
conn.once('open', () => {
  gfsBucket = new GridFSBucket(conn.db, {
    bucketName: 'archivos'
  });
  console.log('GridFS Bucket inicializado');
});

module.exports = gfsBucket;