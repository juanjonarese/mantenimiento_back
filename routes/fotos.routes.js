const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middelware/auth.middleware');
const { subirFoto } = require('../controllers/fotos.controller');

// Diagnóstico: verifica si Cloudinary está configurado (sin auth)
router.get('/test', (req, res) => {
  const configurado = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    configurado,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '(no configurado)',
  });
});

// Diagnóstico: intenta subir una imagen de prueba real a Cloudinary
router.get('/test-upload', async (req, res) => {
  try {
    const cloudinary = require('../config/cloudinary');
    // Pixel rojo 1x1 en base64
    const testImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';
    const result = await cloudinary.uploader.upload(testImg, {
      folder: 'pintura-vial/test',
      public_id: `test-${Date.now()}`,
    });
    res.json({ ok: true, url: result.secure_url });
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});

router.post('/upload', verificarToken, subirFoto);

module.exports = router;
