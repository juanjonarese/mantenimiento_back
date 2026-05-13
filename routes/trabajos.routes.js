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
const { verificarToken, verificarAdmin } = require("../middelware/auth.middleware");

// Todas las rutas requieren autenticación
router.use(verificarToken);

router.get("/estadisticas", obtenerEstadisticas);
router.get("/", obtenerTodos);
router.get("/:id", obtenerPorId);
router.post("/", crearTrabajo);
router.post("/sync", sincronizarTrabajos);
router.put("/:id", actualizarTrabajo);
router.delete("/:id", verificarAdmin, eliminarTrabajo);

module.exports = router;
