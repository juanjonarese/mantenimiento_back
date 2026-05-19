const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require("../middelware/auth.middleware");
const {
  obtenerMateriales,
  obtenerTodos,
  crearMaterial,
  actualizarMaterial,
  eliminarMaterial,
} = require("../controllers/materialCatalogo.controller");

router.get("/",        verificarToken, obtenerMateriales);   // activos — para supervisores
router.get("/todos",   verificarToken, verificarAdmin, obtenerTodos); // todos — admin
router.post("/",       verificarToken, verificarAdmin, crearMaterial);
router.put("/:id",     verificarToken, verificarAdmin, actualizarMaterial);
router.delete("/:id",  verificarToken, verificarAdmin, eliminarMaterial);

module.exports = router;
