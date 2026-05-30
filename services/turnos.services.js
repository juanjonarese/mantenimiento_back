const TurnoModel = require("../models/turnos.model");
const MaterialCatalogo = require("../models/materialCatalogo.model");

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

    // Descontar stock de cada material usado
    if (materiales && materiales.length > 0) {
      await Promise.allSettled(
        materiales.map(async ({ materialId, nombre, cantidad }) => {
          const mat = materialId
            ? await MaterialCatalogo.findById(materialId)
            : await MaterialCatalogo.findOne({ nombre, activo: true });
          if (!mat) return;
          const nuevoStock = Math.max(0, (mat.stock || 0) - (cantidad || 0));
          await MaterialCatalogo.findByIdAndUpdate(mat._id, { stock: nuevoStock });
        })
      );
    }

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

const obtenerConsumoMaterialesService = async () => {
  try {
    const turnos = await TurnoModel.find({ estado: "cerrado" }, { materiales: 1 });
    const mapa = {};
    turnos.forEach(({ materiales }) => {
      (materiales || []).forEach(({ nombre, cantidad, unidad }) => {
        const key = `${nombre}||${unidad || ""}`;
        if (!mapa[key]) mapa[key] = { nombre, unidad: unidad || "", cantidad: 0 };
        mapa[key].cantidad += cantidad || 0;
      });
    });
    const consumo = Object.values(mapa)
      .map((m) => ({ ...m, cantidad: parseFloat(m.cantidad.toFixed(3)) }))
      .sort((a, b) => b.cantidad - a.cantidad);
    return { consumo, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerConsumoMaterialesService:", error);
    return { consumo: [], statusCode: 500 };
  }
};

module.exports = {
  abrirTurnoService,
  obtenerTurnoActivoService,
  cerrarTurnoService,
  obtenerTodosLosTurnosService,
  obtenerConsumoMaterialesService,
};
