const express = require("express");
const router = express.Router();
const { verificarToken } = require("../middelware/auth.middleware");
const {
  obtenerTodos,
  obtenerPorId,
  crearTrabajo,
  actualizarTrabajo,
  eliminarTrabajo,
  sincronizarTrabajos,
  obtenerEstadisticas,
} = require("../controllers/trabajos.controller");

router.get("/estadisticas", verificarToken, obtenerEstadisticas);
router.get("/", verificarToken, obtenerTodos);
router.get("/:id", verificarToken, obtenerPorId);
router.post("/", verificarToken, crearTrabajo);
router.post("/sync", verificarToken, sincronizarTrabajos);
router.put("/:id", verificarToken, actualizarTrabajo);
router.delete("/:id", verificarToken, eliminarTrabajo);

module.exports = router;
