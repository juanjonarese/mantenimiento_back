const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require("../middelware/auth.middleware");
const { obtenerTiposTarea, crearTipoTarea, actualizarTipoTarea, toggleActivo } = require("../controllers/tiposTarea.controller");

router.get("/", verificarToken, obtenerTiposTarea);
router.post("/", verificarToken, verificarAdmin, crearTipoTarea);
router.put("/:id", verificarToken, verificarAdmin, actualizarTipoTarea);
router.patch("/:id/toggle", verificarToken, verificarAdmin, toggleActivo);

module.exports = router;
