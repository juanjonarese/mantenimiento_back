const express = require("express");
const router = express.Router();
const {
  obtenerTodosLosUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUnUsuarioPorId,
  iniciarSesion,
} = require("../controllers/usuarios.controller");

router.post("/login", iniciarSesion);
router.post("/registro", crearUsuario);
router.get("/", obtenerTodosLosUsuarios);
router.get("/:id", obtenerUsuarioPorId);
router.put("/:id", actualizarUsuario);
router.delete("/:id", eliminarUnUsuarioPorId);

module.exports = router;
