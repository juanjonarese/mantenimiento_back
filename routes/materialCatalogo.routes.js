const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require("../middelware/auth.middleware");
const {
  obtenerMateriales,
  obtenerTodos,
  crearMaterial,
  actualizarMaterial,
  eliminarMaterial,
  registrarEntrada,
  obtenerEntradas,
  obtenerTotalesEntradas,
} = require("../controllers/materialCatalogo.controller");

router.get("/",                   verificarToken,               obtenerMateriales);
router.get("/todos",              verificarToken, verificarAdmin, obtenerTodos);
router.get("/totales-entradas",   verificarToken, verificarAdmin, obtenerTotalesEntradas);
router.post("/",                  verificarToken, verificarAdmin, crearMaterial);
router.get("/:id/entradas",       verificarToken, verificarAdmin, obtenerEntradas);
router.post("/:id/entrada",       verificarToken, verificarAdmin, registrarEntrada);
router.put("/:id",                verificarToken, verificarAdmin, actualizarMaterial);
router.delete("/:id",             verificarToken, verificarAdmin, eliminarMaterial);

module.exports = router;
