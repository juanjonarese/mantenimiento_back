const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require("../middelware/auth.middleware");
const {
  obtenerTodosLosUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUnUsuarioPorId,
  iniciarSesion,
} = require("../controllers/usuarios.controller");

router.post("/login",    iniciarSesion);
router.post("/registro", verificarToken, verificarAdmin, crearUsuario);
router.get("/",          verificarToken, verificarAdmin, obtenerTodosLosUsuarios);
router.get("/:id",       verificarToken, obtenerUsuarioPorId);
router.put("/:id",       verificarToken, verificarAdmin, actualizarUsuario);
router.delete("/:id",    verificarToken, verificarAdmin, eliminarUnUsuarioPorId);

module.exports = router;
