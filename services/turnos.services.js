const TurnoModel = require("../models/turnos.model");
const MaterialCatalogo = require("../models/materialCatalogo.model");
const Trabajo = require("../models/trabajos.model");

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

      // Distribuir materiales proporcionalmente por m² entre los trabajos del turno
      const trabajosDelTurno = await Trabajo.find({ turno: idTurno });
      const totalSuperficie = trabajosDelTurno.reduce((s, t) => s + (t.superficie || 0), 0);
      if (trabajosDelTurno.length > 0 && totalSuperficie > 0) {
        await Promise.allSettled(
          trabajosDelTurno.map((t) => {
            const prop = (t.superficie || 0) / totalSuperficie;
            const materialesTrabajo = materiales.map(({ nombre, cantidad, unidad }) => ({
              nombre,
              cantidad: parseFloat((cantidad * prop).toFixed(4)),
              unidad: unidad || "",
            }));
            return Trabajo.findByIdAndUpdate(t._id, { materiales: materialesTrabajo });
          })
        );
      }
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

const obtenerTurnosConTrabajosService = async () => {
  try {
    const [turnos, trabajosRaw] = await Promise.all([
      TurnoModel.find()
        .populate("supervisor", "nombre apellido")
        .sort({ fechaInicio: -1 })
        .lean(),
      Trabajo.find(
        { turno: { $exists: true, $ne: null } },
        { turno: 1, tipoTrabajo: 1, superficie: 1, items: 1, clienteNombre: 1 }
      ).lean(),
    ]);

    const gruposPorTurno = {};
    trabajosRaw.forEach((t) => {
      const key = String(t.turno);
      if (!gruposPorTurno[key]) gruposPorTurno[key] = [];
      gruposPorTurno[key].push(t);
    });


    const resultado = turnos.map((turno) => {
      const trabajos = gruposPorTurno[String(turno._id)] || [];
      const m2Map = {};
      trabajos.forEach((t) => {
        const tipos = t.items?.length > 0
          ? t.items.map((i) => ({ tipo: i.tipoTrabajo, m2: i.superficie || 0 }))
          : [{ tipo: t.tipoTrabajo, m2: t.superficie || 0 }];
        tipos.forEach(({ tipo, m2 }) => {
          if (!tipo) return;
          m2Map[tipo] = (m2Map[tipo] || 0) + m2;
        });
      });
      const m2PorTipo = Object.entries(m2Map)
        .map(([tipo, m2]) => ({ tipo, m2: parseFloat(m2.toFixed(2)) }))
        .sort((a, b) => b.m2 - a.m2);
      const clientes = [...new Set(
        trabajos.map((t) => t.clienteNombre).filter(Boolean)
      )];
      return {
        ...turno,
        cantidadTrabajos: trabajos.length,
        m2PorTipo,
        totalM2: parseFloat(m2PorTipo.reduce((s, t) => s + t.m2, 0).toFixed(2)),
        clientes,
      };
    });

    return { turnos: resultado, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerTurnosConTrabajosService:", error);
    return { turnos: [], statusCode: 500 };
  }
};

const eliminarTurnosService = async (ids) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0)
      return { msg: "No se proporcionaron IDs", statusCode: 400 };
    await Promise.all([
      TurnoModel.deleteMany({ _id: { $in: ids } }),
      Trabajo.updateMany({ turno: { $in: ids } }, { $unset: { turno: "" } }),
    ]);
    return { msg: `${ids.length} turno(s) eliminado(s)`, statusCode: 200 };
  } catch (error) {
    console.error("Error en eliminarTurnosService:", error);
    return { msg: "Error al eliminar turnos", statusCode: 500 };
  }
};

module.exports = {
  abrirTurnoService,
  obtenerTurnoActivoService,
  cerrarTurnoService,
  obtenerTodosLosTurnosService,
  obtenerConsumoMaterialesService,
  obtenerTurnosConTrabajosService,
  eliminarTurnosService,
};
