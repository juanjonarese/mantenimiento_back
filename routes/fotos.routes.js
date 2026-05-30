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

router.post('/upload', verificarToken, subirFoto);

module.exports = router;
