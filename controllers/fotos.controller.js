const cloudinary = require('../config/cloudinary');

function sanitizarCarpeta(texto) {
  return (texto || 'sin-ubicacion')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

const subirFoto = async (req, res) => {
  try {
    const { data, nombre, tipo, calle1, calle2 } = req.body;
    if (!data) return res.status(400).json({ msg: 'Se requiere el archivo en base64' });

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(503).json({ msg: 'Cloudinary no está configurado en el servidor' });
    }

    const resourceType = tipo?.startsWith('video/') ? 'video' : 'image';

    const mes = new Date().toISOString().slice(0, 7); // "2026-05"
    const ubicacion = calle1
      ? `${sanitizarCarpeta(calle1)}-y-${sanitizarCarpeta(calle2 || '')}`
      : 'sin-ubicacion';
    const folder = `pintura-vial/${mes}/${ubicacion}`;

    const publicId = `${Date.now()}-${(nombre || 'archivo').replace(/\.[^.]+$/, '')}`;

    const result = await cloudinary.uploader.upload(data, {
      folder,
      resource_type: resourceType,
      public_id: publicId,
    });

    res.status(200).json({ url: result.secure_url, publicId: result.public_id, folder });
  } catch (error) {
    console.error('Error al subir a Cloudinary:', error);
    res.status(500).json({ msg: error.message || 'Error al subir el archivo' });
  }
};

module.exports = { subirFoto };
