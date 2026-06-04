const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require("../middelware/auth.middleware");
const { abrirTurno, obtenerTurnoActivo, cerrarTurno, obtenerTodosTurnos, obtenerConsumoMateriales, obtenerTurnosConTrabajos, eliminarTurnos } = require("../controllers/turnos.controller");

router.post("/abrir",         verificarToken,               abrirTurno);
router.get("/activo",         verificarToken,               obtenerTurnoActivo);
router.get("/consumo",        verificarToken, verificarAdmin, obtenerConsumoMateriales);
router.get("/con-trabajos",   verificarToken, verificarAdmin, obtenerTurnosConTrabajos);
router.get("/",               verificarToken, verificarAdmin, obtenerTodosTurnos);
router.put("/:id/cerrar",     verificarToken,               cerrarTurno);
router.delete("/",            verificarToken, verificarAdmin, eliminarTurnos);

module.exports = router;
