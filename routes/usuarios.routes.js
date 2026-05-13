const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const {
  obtenerTodosLosUsuarios,
  obtenerUsuarioPorId,
  iniciarSesion,
  crearUsuario,
  actualizarUsuario,
  eliminarUnUsuarioPorId,
} = require("../controllers/usuarios.controller");
const { verificarToken, verificarAdmin } = require("../middelware/auth.middleware");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { msg: "Demasiados intentos de login. Intentá nuevamente en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rutas públicas
router.post("/login", loginLimiter, iniciarSesion);
router.post("/registro", crearUsuario);

// Rutas protegidas - requieren autenticación
router.get("/", verificarToken, obtenerTodosLosUsuarios);
router.get("/:id", verificarToken, obtenerUsuarioPorId);

// Rutas de administración - requieren autenticación + rol admin
router.put("/:id", verificarToken, verificarAdmin, actualizarUsuario);
router.delete("/:id", verificarToken, verificarAdmin, eliminarUnUsuarioPorId);

module.exports = router;
