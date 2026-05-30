const cloudinary = require('../config/cloudinary');

const subirFoto = async (req, res) => {
  try {
    const { data, nombre, tipo } = req.body;
    if (!data) return res.status(400).json({ msg: 'Se requiere el archivo en base64' });

    const resourceType = tipo?.startsWith('video/') ? 'video' : 'image';
    const publicId = `${Date.now()}-${(nombre || 'archivo').replace(/\.[^.]+$/, '')}`;

    const result = await cloudinary.uploader.upload(data, {
      folder: 'pintura-vial',
      resource_type: resourceType,
      public_id: publicId,
    });

    res.status(200).json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('Error al subir a Cloudinary:', error);
    res.status(500).json({ msg: 'Error al subir el archivo' });
  }
};

module.exports = { subirFoto };
