const usuariosModel = require("../models/usuarios.model");
const argon2 = require("argon2");

const {
  obtenerTodosLosUsuariosService,
  obteneUsuriosPorIdService,
  iniciarSesionService,
  crearUsuarioService,
  eliminarUnUsuarioPorIdServices,
} = require("../services/usuarios.services");

const obtenerTodosLosUsuarios = async (req, res) => {
  try {
    const { statusCode, usuarios } = await obtenerTodosLosUsuariosService();
    res.status(statusCode).json({ usuarios });
  } catch (error) {
    console.error("Error en obtenerTodosLosUsuarios:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { statusCode, usuario } = await obteneUsuriosPorIdService(
      req.params.id
    );
    res.status(statusCode).json({ usuario });
  } catch (error) {
    console.error("Error en obtenerUsuarioPorId:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const crearUsuario = async (req, res) => {
  try {
    const { statusCode, msg, usuario } = await crearUsuarioService(req.body);

    res.status(statusCode).json({
      msg,
      usuario: usuario || null,
    });
  } catch (error) {
    console.error("Error en crearUsuario controller:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const eliminarUnUsuarioPorId = async (req, res) => {
  const { msg, statusCode } = await eliminarUnUsuarioPorIdServices(
    req.params.id
  );
  res.status(statusCode).json({ msg });
};

const iniciarSesion = async (req, res) => {
  try {
    const { statusCode, msg, token, email, rol } = await iniciarSesionService(
      req.body
    );
    res.status(statusCode).json({ msg, token, email, rol });
  } catch (error) {
    console.error("Error en iniciarSesion controller:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, password, rol } = req.body;

    const usuario = await usuariosModel.findById(id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Actualizar campos
    if (nombre) usuario.nombre = nombre;
    if (apellido) usuario.apellido = apellido;
    if (email) usuario.email = email;
    if (rol) usuario.rol = rol;

    // Si se envía nueva contraseña, validar y hashearla
    if (password) {
      // Validar formato de contraseña: alfanumérica, comienza con mayúscula, mínimo 6 caracteres
      const passwordRegex = /^[A-Z](?=.*[a-z])(?=.*\d)[A-Za-z\d]{5,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          msg: "La contraseña debe comenzar con MAYÚSCULA, contener letras y números (mínimo 6 caracteres alfanuméricos). Ejemplo: Admin123"
        });
      }
      const passwordHash = await argon2.hash(password);
      usuario.password = passwordHash;
    }

    await usuario.save();

    res.status(200).json({
      msg: "Usuario actualizado correctamente",
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al actualizar el usuario" });
  }
};

module.exports = {
  obtenerTodosLosUsuarios,
  obtenerUsuarioPorId,
  iniciarSesion,
  crearUsuario,
  actualizarUsuario,
  eliminarUnUsuarioPorId,
};
