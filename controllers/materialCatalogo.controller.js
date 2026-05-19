const {
  obtenerMaterialesService,
  obtenerTodosService,
  crearMaterialService,
  actualizarMaterialService,
  eliminarMaterialService,
} = require("../services/materialCatalogo.services");

const obtenerMateriales = async (req, res) => {
  try {
    const { materiales, statusCode } = await obtenerMaterialesService();
    res.status(statusCode).json({ materiales });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const obtenerTodos = async (req, res) => {
  try {
    const { materiales, statusCode } = await obtenerTodosService();
    res.status(statusCode).json({ materiales });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const crearMaterial = async (req, res) => {
  try {
    const resultado = await crearMaterialService(req.body);
    if (resultado.msg && !resultado.material) return res.status(resultado.statusCode).json({ msg: resultado.msg });
    res.status(resultado.statusCode).json({ material: resultado.material });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const actualizarMaterial = async (req, res) => {
  try {
    const resultado = await actualizarMaterialService(req.params.id, req.body);
    if (resultado.msg && !resultado.material) return res.status(resultado.statusCode).json({ msg: resultado.msg });
    res.status(resultado.statusCode).json({ material: resultado.material });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const eliminarMaterial = async (req, res) => {
  try {
    const { statusCode, msg } = await eliminarMaterialService(req.params.id);
    res.status(statusCode).json({ msg });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

module.exports = { obtenerMateriales, obtenerTodos, crearMaterial, actualizarMaterial, eliminarMaterial };
