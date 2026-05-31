const Material = require("../models/materialCatalogo.model");

const obtenerMaterialesService = async () => {
  try {
    const materiales = await Material.find({ activo: true }).sort({ nombre: 1 });
    return { materiales, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerMaterialesService:", error);
    return { materiales: [], statusCode: 500 };
  }
};

const obtenerTodosService = async () => {
  try {
    const materiales = await Material.find().sort({ nombre: 1 });
    return { materiales, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerTodosService:", error);
    return { materiales: [], statusCode: 500 };
  }
};

const crearMaterialService = async (datos) => {
  try {
    if (!datos.nombre?.trim()) return { msg: "El nombre es obligatorio", statusCode: 400 };
    const existente = await Material.findOne({ nombre: datos.nombre.trim() });
    if (existente) return { msg: "Ya existe un material con ese nombre", statusCode: 409 };
    const material = await Material.create({
      codigo:     datos.codigo?.trim() || "",
      nombre:     datos.nombre.trim(),
      stock:      parseFloat(datos.stock) || 0,
      unidad:     datos.unidad || "litros",
      tamano:     datos.tamano?.trim() || "",
      tiposTarea: Array.isArray(datos.tiposTarea) ? datos.tiposTarea : [],
    });
    return { material, statusCode: 201 };
  } catch (error) {
    console.error("Error en crearMaterialService:", error);
    return { msg: "Error al crear el material", statusCode: 500 };
  }
};

const actualizarMaterialService = async (id, datos) => {
  try {
    const material = await Material.findByIdAndUpdate(id, {
      codigo:     datos.codigo?.trim() || "",
      nombre:     datos.nombre?.trim(),
      stock:      parseFloat(datos.stock) || 0,
      unidad:     datos.unidad,
      tamano:     datos.tamano?.trim() || "",
      tiposTarea: Array.isArray(datos.tiposTarea) ? datos.tiposTarea : [],
    }, { new: true, runValidators: true });
    if (!material) return { msg: "Material no encontrado", statusCode: 404 };
    return { material, statusCode: 200 };
  } catch (error) {
    console.error("Error en actualizarMaterialService:", error);
    return { msg: "Error al actualizar el material", statusCode: 500 };
  }
};

const eliminarMaterialService = async (id) => {
  try {
    const material = await Material.findByIdAndUpdate(id, { activo: false }, { new: true });
    if (!material) return { msg: "Material no encontrado", statusCode: 404 };
    return { msg: "Material eliminado", statusCode: 200 };
  } catch (error) {
    console.error("Error en eliminarMaterialService:", error);
    return { msg: "Error al eliminar", statusCode: 500 };
  }
};

module.exports = {
  obtenerMaterialesService,
  obtenerTodosService,
  crearMaterialService,
  actualizarMaterialService,
  eliminarMaterialService,
};
