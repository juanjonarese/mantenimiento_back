const argon = require("argon2");
const jwt = require("jsonwebtoken");
const usuariosModel = require("../models/usuarios.model");

const crearUsuarioService = async (body) => {
  try {
    // Validar campos requeridos
    if (!body.nombre || !body.apellido || !body.email || !body.password) {
      return {
        msg: "Todos los campos son obligatorios (nombre, apellido, email, contraseña)",
        statusCode: 400,
      };
    }

    // Validar formato de contraseña: alfanumérica, comienza con mayúscula, mínimo 6 caracteres
    const passwordRegex = /^[A-Z](?=.*[a-z])(?=.*\d)[A-Za-z\d]{5,}$/;
    if (!passwordRegex.test(body.password)) {
      return {
        msg: "La contraseña debe comenzar con MAYÚSCULA, contener letras y números (mínimo 6 caracteres alfanuméricos). Ejemplo: Admin123",
        statusCode: 400,
      };
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await usuariosModel.findOne({
      email: body.email,
    });
    if (usuarioExistente) {
      return {
        msg: "Ya existe una cuenta registrada con este email. Intentá iniciar sesión.",
        statusCode: 409,
      };
    }

    // Hashear la contraseña
    const passwordHasheada = await argon.hash(body.password);

    // Crear el usuario con la contraseña hasheada
    const nuevoUsuario = new usuariosModel({
      nombre: body.nombre,
      apellido: body.apellido,
      email: body.email,
      password: passwordHasheada,
    });

    // Guardar el usuario
    await nuevoUsuario.save();

    return {
      msg: "¡Cuenta creada exitosamente! Ya podés iniciar sesión.",
      statusCode: 201,
      usuario: {
        id: nuevoUsuario._id,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
      },
    };
  } catch (error) {
    console.error("Error en crearUsuarioService:", error);

    return {
      msg: "Error al crear la cuenta. Intentá nuevamente más tarde.",
      statusCode: 500,
    };
  }
};

const eliminarUnUsuarioPorIdServices = async (idUsuario) => {
  try {
    const usuarioEliminado = await usuariosModel.findByIdAndDelete({
      _id: idUsuario,
    });

    if (!usuarioEliminado) {
      return {
        msg: "Usuario no encontrado",
        statusCode: 404,
      };
    }

    return {
      msg: "Usuario eliminado correctamente",
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error en eliminarUnUsuarioPorIdServices:", error);
    return {
      msg: "Error al eliminar el usuario",
      statusCode: 500,
    };
  }
};

const obtenerTodosLosUsuariosService = async () => {
  try {
    const usuarios = await usuariosModel.find({}, { password: 0 });
    return {
      usuarios,
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error en obtenerTodosLosUsuariosService:", error);
    return {
      usuarios: [],
      statusCode: 500,
    };
  }
};

const obteneUsuriosPorIdService = async (idUsuario) => {
  try {
    const usuario = await usuariosModel.findById(idUsuario).select("-password");

    if (!usuario) {
      return {
        usuario: null,
        msg: "Usuario no encontrado",
        statusCode: 404,
      };
    }

    return {
      usuario,
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error en obteneUsuriosPorIdService:", error);
    return {
      usuario: null,
      msg: "Error al buscar el usuario",
      statusCode: 500,
    };
  }
};

const iniciarSesionService = async (body) => {
  try {
    const usuarioExiste = await usuariosModel.findOne({ email: body.email });

    if (!usuarioExiste) {
      return { msg: "Email o contraseña incorrectos.", statusCode: 401 };
    }

    if (!usuarioExiste.password) {
      return { msg: "Error en la configuración de tu cuenta. Contactá al administrador.", statusCode: 500 };
    }

    const passCheck = await argon.verify(usuarioExiste.password, body.password);

    if (!passCheck) {
      return { msg: "Email o contraseña incorrectos.", statusCode: 401 };
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET no configurado");
    }

    const token = jwt.sign(
      { idUsuario: usuarioExiste._id, email: usuarioExiste.email, rol: usuarioExiste.rol },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return {
      msg: `¡Bienvenido de nuevo, ${usuarioExiste.nombre}!`,
      token,
      email: usuarioExiste.email,
      rol: usuarioExiste.rol,
      nombre: usuarioExiste.nombre,
      apellido: usuarioExiste.apellido,
      idUsuario: usuarioExiste._id,
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error en iniciarSesionService:", error);
    return { msg: "Error en el servidor. Por favor, intentá nuevamente más tarde.", statusCode: 500 };
  }
};

module.exports = {
  obtenerTodosLosUsuariosService,
  obteneUsuriosPorIdService,
  iniciarSesionService,
  crearUsuarioService,
  eliminarUnUsuarioPorIdServices,
};
