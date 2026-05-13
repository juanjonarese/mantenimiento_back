const jwt = require("jsonwebtoken");
const usuariosModel = require("../models/usuarios.model");

const verificarToken = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ msg: "No hay token, autorización denegada" });
  }

  try {
    const tokenLimpio = token.replace("Bearer ", "").trim();
    const verificarUsuario = jwt.verify(tokenLimpio, process.env.JWT_SECRET);

    const usuario = await usuariosModel.findById(verificarUsuario.idUsuario);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    req.idUsuario = verificarUsuario.idUsuario;
    req.usuario = usuario;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token no válido o expirado" });
  }
};

const verificarAdmin = (req, res, next) => {
  if (req.usuario.rol !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado. Se requieren permisos de administrador." });
  }
  next();
};

module.exports = { verificarToken, verificarAdmin };
