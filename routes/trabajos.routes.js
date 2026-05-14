const express = require("express");
const router = express.Router();
const {
  obtenerTodos,
  obtenerPorId,
  crearTrabajo,
  actualizarTrabajo,
  eliminarTrabajo,
  sincronizarTrabajos,
  obtenerEstadisticas,
} = require("../controllers/trabajos.controller");

router.get("/estadisticas", obtenerEstadisticas);
router.get("/", obtenerTodos);
router.get("/:id", obtenerPorId);
router.post("/", crearTrabajo);
router.post("/sync", sincronizarTrabajos);
router.put("/:id", actualizarTrabajo);
router.delete("/:id", eliminarTrabajo);

module.exports = router;
