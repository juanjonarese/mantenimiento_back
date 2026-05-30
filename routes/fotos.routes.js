const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middelware/auth.middleware');
const { subirFoto } = require('../controllers/fotos.controller');

router.post('/upload', verificarToken, subirFoto);

module.exports = router;
