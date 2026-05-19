const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require("../middelware/auth.middleware");
const { abrirTurno, obtenerTurnoActivo, cerrarTurno, obtenerTodosTurnos } = require("../controllers/turnos.controller");

router.post("/abrir", verificarToken, abrirTurno);
router.get("/activo", verificarToken, obtenerTurnoActivo);
router.put("/:id/cerrar", verificarToken, cerrarTurno);
router.get("/", verificarToken, verificarAdmin, obtenerTodosTurnos);

module.exports = router;
