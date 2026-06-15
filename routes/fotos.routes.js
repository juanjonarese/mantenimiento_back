const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { verificarToken } = require('../middelware/auth.middleware');
const { subirFoto, subirVideo, eliminarFoto } = require('../controllers/fotos.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Solo se aceptan archivos de video'));
  },
});

router.post('/upload',       verificarToken, subirFoto);
router.post('/upload-video', verificarToken, upload.single('video'), subirVideo);
router.delete('/',           verificarToken, eliminarFoto);

module.exports = router;
