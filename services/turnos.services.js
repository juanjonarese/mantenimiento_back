const TurnoModel = require("../models/turnos.model");

const abrirTurnoService = async (idSupervisor) => {
  try {
    const turnoAbierto = await TurnoModel.findOne({ supervisor: idSupervisor, estado: "abierto" });
    if (turnoAbierto) {
      return { turno: turnoAbierto, statusCode: 200, yaTeniaAbierto: true };
    }
    const nuevoTurno = await TurnoModel.create({ supervisor: idSupervisor });
    return { turno: nuevoTurno, statusCode: 201, yaTeniaAbierto: false };
  } catch (error) {
    console.error("Error en abrirTurnoService:", error);
    return { msg: "Error al abrir el turno", statusCode: 500 };
  }
};

const obtenerTurnoActivoService = async (idSupervisor) => {
  try {
    const turno = await TurnoModel.findOne({ supervisor: idSupervisor, estado: "abierto" });
    return { turno: turno || null, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerTurnoActivoService:", error);
    return { turno: null, statusCode: 500 };
  }
};

const cerrarTurnoService = async (idTurno, idSupervisor, materiales, observaciones) => {
  try {
    const turno = await TurnoModel.findOne({ _id: idTurno, supervisor: idSupervisor, estado: "abierto" });
    if (!turno) return { msg: "Turno no encontrado o ya cerrado", statusCode: 404 };

    turno.estado = "cerrado";
    turno.fechaFin = new Date();
    turno.materiales = materiales || [];
    turno.observaciones = observaciones || "";
    await turno.save();

    return { turno, statusCode: 200 };
  } catch (error) {
    console.error("Error en cerrarTurnoService:", error);
    return { msg: "Error al cerrar el turno", statusCode: 500 };
  }
};

const obtenerTodosLosTurnosService = async () => {
  try {
    const turnos = await TurnoModel.find()
      .populate("supervisor", "nombre apellido email")
      .sort({ fechaInicio: -1 });
    return { turnos, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerTodosLosTurnosService:", error);
    return { turnos: [], statusCode: 500 };
  }
};

module.exports = {
  abrirTurnoService,
  obtenerTurnoActivoService,
  cerrarTurnoService,
  obtenerTodosLosTurnosService,
};
