const {
  obtenerTiposTareaService,
  crearTipoTareaService,
  actualizarTipoTareaService,
  toggleActivoService,
} = require("../services/tiposTarea.services");

const obtenerTiposTarea = async (req, res) => {
  try {
    const soloActivos = req.query.todos !== "true";
    const { tipos, statusCode } = await obtenerTiposTareaService(soloActivos);
    res.status(statusCode).json({ tipos });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const crearTipoTarea = async (req, res) => {
  try {
    const resultado = await crearTipoTareaService(req.body);
    if (resultado.msg && !resultado.tipo) return res.status(resultado.statusCode).json({ msg: resultado.msg });
    res.status(resultado.statusCode).json({ tipo: resultado.tipo });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const actualizarTipoTarea = async (req, res) => {
  try {
    const resultado = await actualizarTipoTareaService(req.params.id, req.body);
    if (resultado.msg && !resultado.tipo) return res.status(resultado.statusCode).json({ msg: resultado.msg });
    res.status(resultado.statusCode).json({ tipo: resultado.tipo });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const toggleActivo = async (req, res) => {
  try {
    const resultado = await toggleActivoService(req.params.id);
    if (resultado.msg && !resultado.tipo) return res.status(resultado.statusCode).json({ msg: resultado.msg });
    res.status(resultado.statusCode).json({ tipo: resultado.tipo });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

module.exports = { obtenerTiposTarea, crearTipoTarea, actualizarTipoTarea, toggleActivo };
