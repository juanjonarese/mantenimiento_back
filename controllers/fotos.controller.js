const cloudinary = require('../config/cloudinary');
const { subirAR2, r2Configurado, borrarDeR2PorUrl } = require('../config/r2');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const os = require('os');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

// Destino de los archivos: 'r2' (Cloudflare R2) o 'cloudinary' (respaldo).
const DRIVER = (process.env.STORAGE_DRIVER || 'cloudinary').toLowerCase();

function sanitizarCarpeta(texto) {
  return (texto || 'sin-ubicacion')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// Prefijo/carpeta organizada por mes y ubicación: pintura-vial/2026-06/calle1-y-calle2
function carpetaUbicacion(calle1, calle2) {
  const mes = new Date().toISOString().slice(0, 7);
  const ubicacion = calle1
    ? `${sanitizarCarpeta(calle1)}-y-${sanitizarCarpeta(calle2 || '')}`
    : 'sin-ubicacion';
  return `pintura-vial/${mes}/${ubicacion}`;
}

const subirFoto = async (req, res) => {
  try {
    const { data, nombre, calle1, calle2 } = req.body;
    if (!data) return res.status(400).json({ msg: 'Se requiere el archivo en base64' });

    const folder = carpetaUbicacion(calle1, calle2);
    const baseName = `${Date.now()}-${(nombre || 'archivo').replace(/\.[^.]+$/, '')}`;

    if (DRIVER === 'r2') {
      if (!r2Configurado()) {
        return res.status(503).json({ msg: 'R2 no está configurado en el servidor' });
      }
      // data viene como data URI: "data:image/jpeg;base64,...."
      const match = /^data:(.+);base64,(.*)$/s.exec(data);
      const contentType = match ? match[1] : 'image/jpeg';
      const base64 = match ? match[2] : data;
      const buffer = Buffer.from(base64, 'base64');
      const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const key = `${folder}/${baseName}.${ext}`;
      const url = await subirAR2(buffer, key, contentType);
      return res.status(200).json({ url, publicId: key, folder });
    }

    // Respaldo: Cloudinary
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(503).json({ msg: 'Cloudinary no está configurado en el servidor' });
    }
    const result = await cloudinary.uploader.upload(data, {
      folder,
      resource_type: 'image',
      public_id: baseName,
    });
    res.status(200).json({ url: result.secure_url, publicId: result.public_id, folder });
  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({ msg: error.message || 'Error al subir el archivo' });
  }
};

const subirVideo = async (req, res) => {
  let inputPath = null;
  let outputPath = null;

  try {
    if (!req.file) return res.status(400).json({ msg: 'Se requiere un video' });

    if (DRIVER === 'r2') {
      if (!r2Configurado()) {
        return res.status(503).json({ msg: 'R2 no está configurado en el servidor' });
      }
    } else if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(503).json({ msg: 'Cloudinary no está configurado en el servidor' });
    }

    const { nombre, calle1, calle2 } = req.body;
    const ts = Date.now();
    inputPath  = path.join(os.tmpdir(), `pv-in-${ts}.mp4`);
    outputPath = path.join(os.tmpdir(), `pv-out-${ts}.mp4`);

    fs.writeFileSync(inputPath, req.file.buffer);

    const pesoOriginalMB = (req.file.size / (1024 * 1024)).toFixed(1);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoBitrate('800k')
        .audioBitrate('128k')
        .outputOptions([
          '-preset fast',
          '-crf 28',
          '-vf scale=1280:-2',
          '-movflags +faststart',
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const pesoFinalMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(1);
    console.log(`Video comprimido: ${pesoOriginalMB} MB → ${pesoFinalMB} MB`);

    const folder   = carpetaUbicacion(calle1, calle2);
    const baseName = `${ts}-${(nombre || 'video').replace(/\.[^.]+$/, '')}`;

    if (DRIVER === 'r2') {
      const buffer = fs.readFileSync(outputPath);
      const key = `${folder}/${baseName}.mp4`;
      const url = await subirAR2(buffer, key, 'video/mp4');
      return res.status(200).json({ url, publicId: key, folder });
    }

    // Respaldo: Cloudinary
    const result = await cloudinary.uploader.upload(outputPath, {
      folder,
      resource_type: 'video',
      public_id: baseName,
    });
    res.status(200).json({ url: result.secure_url, publicId: result.public_id, folder });
  } catch (error) {
    console.error('Error al comprimir/subir video:', error);
    res.status(500).json({ msg: error.message || 'Error al procesar el video' });
  } finally {
    if (inputPath  && fs.existsSync(inputPath))  fs.unlinkSync(inputPath);
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
};

// Elimina un archivo de R2 a partir de su URL pública.
const eliminarFoto = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ msg: 'Se requiere la URL del archivo' });

    if (DRIVER !== 'r2') {
      // Con Cloudinary no guardamos el public_id, así que no se puede borrar acá.
      return res.status(200).json({ borrado: false, msg: `Borrado desactivado (driver: ${DRIVER})` });
    }
    if (!r2Configurado()) {
      return res.status(503).json({ msg: 'R2 no está configurado en el servidor' });
    }

    const borrado = await borrarDeR2PorUrl(url);
    res.status(200).json({
      borrado,
      msg: borrado ? 'Archivo eliminado de R2' : 'La URL no pertenece a R2, no se borró nada',
    });
  } catch (error) {
    console.error('Error al eliminar archivo de R2:', error);
    res.status(500).json({ msg: error.message || 'Error al eliminar el archivo' });
  }
};

module.exports = { subirFoto, subirVideo, eliminarFoto };
