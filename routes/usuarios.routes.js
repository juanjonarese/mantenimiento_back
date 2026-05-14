const express = require("express");
const router = express.Router();
const {
  obtenerTodosLosUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUnUsuarioPorId,
} = require("../controllers/usuarios.controller");

router.get("/", obtenerTodosLosUsuarios);
router.get("/:id", obtenerUsuarioPorId);
router.post("/registro", crearUsuario);
router.put("/:id", actualizarUsuario);
router.delete("/:id", eliminarUnUsuarioPorId);

module.exports = router;
