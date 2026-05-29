const {
  abrirTurnoService,
  obtenerTurnoActivoService,
  cerrarTurnoService,
  obtenerTodosLosTurnosService,
  obtenerConsumoMaterialesService,
} = require("../services/turnos.services");

const abrirTurno = async (req, res) => {
  try {
    const resultado = await abrirTurnoService(req.idUsuario);
    if (resultado.msg) return res.status(resultado.statusCode).json({ msg: resultado.msg });
    res.status(resultado.statusCode).json({ turno: resultado.turno, yaTeniaAbierto: resultado.yaTeniaAbierto });
  } catch (error) {
    console.error("Error en abrirTurno:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const obtenerTurnoActivo = async (req, res) => {
  try {
    const { turno, statusCode } = await obtenerTurnoActivoService(req.idUsuario);
    res.status(statusCode).json({ turno });
  } catch (error) {
    console.error("Error en obtenerTurnoActivo:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const cerrarTurno = async (req, res) => {
  try {
    const { materiales, observaciones } = req.body;
    const resultado = await cerrarTurnoService(req.params.id, req.idUsuario, materiales, observaciones);
    if (resultado.msg) return res.status(resultado.statusCode).json({ msg: resultado.msg });
    res.status(resultado.statusCode).json({ turno: resultado.turno });
  } catch (error) {
    console.error("Error en cerrarTurno:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const obtenerTodosTurnos = async (req, res) => {
  try {
    const { turnos, statusCode } = await obtenerTodosLosTurnosService();
    res.status(statusCode).json({ turnos });
  } catch (error) {
    console.error("Error en obtenerTodosTurnos:", error);
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

module.exports = { abrirTurno, obtenerTurnoActivo, cerrarTurno, obtenerTodosTurnos, obtenerConsumoMateriales };
