const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require("../middelware/auth.middleware");
const { obtenerAccesos } = require("../controllers/accesos.controller");

router.get("/", verificarToken, verificarAdmin, obtenerAccesos);

module.exports = router;
