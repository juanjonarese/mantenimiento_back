const TipoTareaModel = require("../models/tiposTarea.model");

const obtenerTiposTareaService = async (soloActivos = true) => {
  try {
    const filtro = soloActivos ? { activo: true } : {};
    const tipos = await TipoTareaModel.find(filtro).sort({ nombre: 1 });
    return { tipos, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerTiposTareaService:", error);
    return { tipos: [], statusCode: 500 };
  }
};

const crearTipoTareaService = async ({ nombre, unidad }) => {
  try {
    if (!nombre?.trim()) return { msg: "El nombre es obligatorio", statusCode: 400 };
    const existente = await TipoTareaModel.findOne({ nombre: nombre.trim() });
    if (existente) return { msg: "Ya existe un tipo de tarea con ese nombre", statusCode: 409 };
    const tipo = await TipoTareaModel.create({ nombre: nombre.trim(), unidad: unidad || "m²" });
    return { tipo, statusCode: 201 };
  } catch (error) {
    console.error("Error en crearTipoTareaService:", error);
    return { msg: "Error al crear el tipo de tarea", statusCode: 500 };
  }
};

const actualizarTipoTareaService = async (id, datos) => {
  try {
    const tipo = await TipoTareaModel.findByIdAndUpdate(id, datos, { new: true });
    if (!tipo) return { msg: "Tipo de tarea no encontrado", statusCode: 404 };
    return { tipo, statusCode: 200 };
  } catch (error) {
    console.error("Error en actualizarTipoTareaService:", error);
    return { msg: "Error al actualizar", statusCode: 500 };
  }
};

const toggleActivoService = async (id) => {
  try {
    const tipo = await TipoTareaModel.findById(id);
    if (!tipo) return { msg: "Tipo de tarea no encontrado", statusCode: 404 };
    tipo.activo = !tipo.activo;
    await tipo.save();
    return { tipo, statusCode: 200 };
  } catch (error) {
    console.error("Error en toggleActivoService:", error);
    return { msg: "Error al cambiar estado", statusCode: 500 };
  }
};

module.exports = {
  obtenerTiposTareaService,
  crearTipoTareaService,
  actualizarTipoTareaService,
  toggleActivoService,
};
