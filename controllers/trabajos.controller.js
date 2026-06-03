const {
  obtenerTodosService,
  obtenerPorIdService,
  crearTrabajoService,
  actualizarTrabajoService,
  eliminarTrabajoService,
  sincronizarTrabajosService,
  obtenerEstadisticasService,
  importarTrabajosService,
  obtenerConsumoMaterialesService,
} = require("../services/trabajos.services");

const obtenerTodos = async (req, res) => {
  try {
    const { statusCode, trabajos } = await obtenerTodosService(req.query);
    res.status(statusCode).json({ trabajos });
  } catch (error) {
    console.error("Error en obtenerTodos:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const { statusCode, trabajo, msg } = await obtenerPorIdService(req.params.id);
    res.status(statusCode).json(trabajo ? { trabajo } : { msg });
  } catch (error) {
    console.error("Error en obtenerPorId:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const crearTrabajo = async (req, res) => {
  try {
    const { statusCode, trabajo, msg } = await crearTrabajoService(req.body);
    res.status(statusCode).json(trabajo ? { trabajo } : { msg });
  } catch (error) {
    console.error("Error en crearTrabajo:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const actualizarTrabajo = async (req, res) => {
  try {
    const { statusCode, trabajo, msg } = await actualizarTrabajoService(req.params.id, req.body);
    res.status(statusCode).json(trabajo ? { trabajo } : { msg });
  } catch (error) {
    console.error("Error en actualizarTrabajo:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const eliminarTrabajo = async (req, res) => {
  try {
    const { statusCode, msg } = await eliminarTrabajoService(req.params.id);
    res.status(statusCode).json({ msg });
  } catch (error) {
    console.error("Error en eliminarTrabajo:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const sincronizarTrabajos = async (req, res) => {
  try {
    const { trabajos } = req.body;
    if (!Array.isArray(trabajos) || trabajos.length === 0) {
      return res.status(400).json({ msg: "Se requiere un array de trabajos" });
    }
    const resultado = await sincronizarTrabajosService(trabajos);
    res.status(resultado.statusCode).json(resultado);
  } catch (error) {
    console.error("Error en sincronizarTrabajos:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const obtenerEstadisticas = async (req, res) => {
  try {
    const { statusCode, estadisticas } = await obtenerEstadisticasService();
    res.status(statusCode).json({ estadisticas });
  } catch (error) {
    console.error("Error en obtenerEstadisticas:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const importarTrabajos = async (req, res) => {
  try {
    const { trabajos } = req.body;
    if (!Array.isArray(trabajos) || trabajos.length === 0) {
      return res.status(400).json({ msg: "Se requiere un array de trabajos" });
    }
    const resultado = await importarTrabajosService(trabajos);
    res.status(resultado.statusCode).json(resultado);
  } catch (error) {
    console.error("Error en importarTrabajos:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const obtenerConsumoMateriales = async (req, res) => {
  try {
    const { consumo, statusCode } = await obtenerConsumoMaterialesService();
    res.status(statusCode).json({ consumo });
  } catch (error) {
    console.error("Error en obtenerConsumoMateriales:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  crearTrabajo,
  actualizarTrabajo,
  eliminarTrabajo,
  sincronizarTrabajos,
  obtenerEstadisticas,
  importarTrabajos,
  obtenerConsumoMateriales,
};
