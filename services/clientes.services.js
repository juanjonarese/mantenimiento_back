const Cliente = require("../models/clientes.model");

const obtenerClientesService = async () => {
  try {
    const clientes = await Cliente.find({ activo: true }).sort({ nombre: 1 });
    return { clientes, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerClientesService:", error);
    return { clientes: [], statusCode: 500 };
  }
};

const crearClienteService = async (datos) => {
  try {
    const { nombre, cuit, contacto, telefono, email, direccion } = datos;
    if (!nombre?.trim() || !cuit?.trim()) {
      return { msg: "La razón social y el CUIT son obligatorios", statusCode: 400 };
    }
    const cuitLimpio = cuit.replace(/[-\s]/g, "");
    if (!/^\d{11}$/.test(cuitLimpio)) {
      return { msg: "El CUIT debe tener 11 dígitos", statusCode: 400 };
    }
    const existente = await Cliente.findOne({ cuit: cuitLimpio });
    if (existente) return { msg: "Ya existe un cliente con ese CUIT", statusCode: 409 };

    const cliente = await Cliente.create({
      nombre: nombre.trim(),
      cuit: cuitLimpio,
      contacto: contacto.trim(),
      telefono: telefono.trim(),
      email: email.trim().toLowerCase(),
      direccion: direccion.trim(),
    });
    return { cliente, statusCode: 201 };
  } catch (error) {
    console.error("Error en crearClienteService:", error);
    return { msg: "Error al crear el cliente", statusCode: 500 };
  }
};

const actualizarClienteService = async (id, datos) => {
  try {
    const { nombre, cuit, contacto, telefono, email, direccion } = datos;
    if (!nombre?.trim() || !cuit?.trim()) {
      return { msg: "La razón social y el CUIT son obligatorios", statusCode: 400 };
    }
    const cuitLimpio = cuit.replace(/[-\s]/g, "");
    if (!/^\d{11}$/.test(cuitLimpio)) {
      return { msg: "El CUIT debe tener 11 dígitos", statusCode: 400 };
    }
    const duplicado = await Cliente.findOne({ cuit: cuitLimpio, _id: { $ne: id } });
    if (duplicado) return { msg: "Ya existe otro cliente con ese CUIT", statusCode: 409 };

    const cliente = await Cliente.findByIdAndUpdate(id, {
      nombre: nombre.trim(),
      cuit: cuitLimpio,
      contacto: contacto.trim(),
      telefono: telefono.trim(),
      email: email.trim().toLowerCase(),
      direccion: direccion.trim(),
    }, { new: true, runValidators: true });

    if (!cliente) return { msg: "Cliente no encontrado", statusCode: 404 };
    return { cliente, statusCode: 200 };
  } catch (error) {
    console.error("Error en actualizarClienteService:", error);
    return { msg: "Error al actualizar el cliente", statusCode: 500 };
  }
};

const obtenerTodosClientesService = async () => {
  try {
    const clientes = await Cliente.find().sort({ activo: -1, nombre: 1 });
    return { clientes, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerTodosClientesService:", error);
    return { clientes: [], statusCode: 500 };
  }
};

const toggleClienteService = async (id) => {
  try {
    const cliente = await Cliente.findById(id);
    if (!cliente) return { msg: "Cliente no encontrado", statusCode: 404 };
    cliente.activo = !cliente.activo;
    await cliente.save();
    return { cliente, statusCode: 200 };
  } catch (error) {
    console.error("Error en toggleClienteService:", error);
    return { msg: "Error al cambiar el estado del cliente", statusCode: 500 };
  }
};

module.exports = {
  obtenerClientesService,
  obtenerTodosClientesService,
  crearClienteService,
  actualizarClienteService,
  toggleClienteService,
};
