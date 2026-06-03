const Material = require("../models/materialCatalogo.model");
const StockEntrada = require("../models/stockEntrada.model");

const sortPorCodigo = (lista) =>
  lista.sort((a, b) => {
    const ca = a.codigo || '';
    const cb = b.codigo || '';
    if (!ca && !cb) return a.nombre.localeCompare(b.nombre, 'es');
    if (!ca) return 1;
    if (!cb) return -1;
    return ca.localeCompare(cb, 'es') || a.nombre.localeCompare(b.nombre, 'es');
  });

const obtenerMaterialesService = async () => {
  try {
    const materiales = sortPorCodigo(await Material.find({ activo: true }).lean());
    return { materiales, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerMaterialesService:", error);
    return { materiales: [], statusCode: 500 };
  }
};

const obtenerTodosService = async () => {
  try {
    const materiales = sortPorCodigo(await Material.find().lean());
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

const registrarEntradaService = async (materialId, datos) => {
  try {
    const material = await Material.findById(materialId);
    if (!material || !material.activo) return { msg: "Material no encontrado", statusCode: 404 };
    const cantidad = parseFloat(datos.cantidad);
    if (isNaN(cantidad) || cantidad === 0) return { msg: "La cantidad no puede ser 0", statusCode: 400 };
    const entrada = await StockEntrada.create({
      material:    materialId,
      cantidad,
      fecha:       datos.fecha ? new Date(datos.fecha) : new Date(),
      descripcion: datos.descripcion?.trim() || "",
    });
    return { entrada, statusCode: 201 };
  } catch (error) {
    console.error("Error en registrarEntradaService:", error);
    return { msg: "Error al registrar entrada", statusCode: 500 };
  }
};

const obtenerEntradasService = async (materialId) => {
  try {
    const entradas = await StockEntrada.find({ material: materialId }).sort({ fecha: -1 });
    return { entradas, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerEntradasService:", error);
    return { entradas: [], statusCode: 500 };
  }
};

const obtenerTotalesEntradasService = async () => {
  try {
    const totales = await StockEntrada.aggregate([
      { $group: { _id: "$material", total: { $sum: "$cantidad" } } },
    ]);
    return { totales, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerTotalesEntradasService:", error);
    return { totales: [], statusCode: 500 };
  }
};

module.exports = {
  obtenerMaterialesService,
  obtenerTodosService,
  crearMaterialService,
  actualizarMaterialService,
  eliminarMaterialService,
  registrarEntradaService,
  obtenerEntradasService,
  obtenerTotalesEntradasService,
};
