const Trabajo = require("../models/trabajos.model");

// Excluye base64 de fotos — solo guarda metadatos
function sanitizarFotos(fotos = []) {
  return fotos.map(({ nombre, tipo, driveUrl, subido }) => ({
    nombre,
    tipo,
    driveUrl: driveUrl || null,
    subido: subido || false,
  }));
}

const obtenerTodosService = async (filtros = {}) => {
  const query = {};
  if (filtros.usuario)          query.usuario = filtros.usuario;
  if (filtros.estadoOperativo)  query.estadoOperativo = filtros.estadoOperativo;
  if (filtros.estadoAdmin)      query.estadoAdmin = filtros.estadoAdmin;
  if (filtros.tipoTrabajo)      query.$or = [{ tipoTrabajo: filtros.tipoTrabajo }, { 'items.tipoTrabajo': filtros.tipoTrabajo }];
  if (filtros.desde || filtros.hasta) {
    query.fechaCarga = {};
    if (filtros.desde) query.fechaCarga.$gte = new Date(filtros.desde);
    if (filtros.hasta) query.fechaCarga.$lte = new Date(filtros.hasta);
  }

  const trabajos = await Trabajo.find(query).sort({ fechaCarga: -1 });
  return { statusCode: 200, trabajos };
};

const obtenerPorIdService = async (id) => {
  const trabajo = await Trabajo.findById(id);
  if (!trabajo) return { statusCode: 404, msg: "Trabajo no encontrado" };
  return { statusCode: 200, trabajo };
};

const crearTrabajoService = async (datos) => {
  const existente = await Trabajo.findOne({ idLocal: datos.idLocal });
  if (existente) return { statusCode: 409, msg: "Ya existe un trabajo con ese ID local" };

  const trabajo = new Trabajo({
    ...datos,
    fotos: sanitizarFotos(datos.fotos),
    cantFotos: datos.fotos?.length || 0,
  });
  await trabajo.save();
  return { statusCode: 201, trabajo };
};

const actualizarTrabajoService = async (id, datos) => {
  const trabajo = await Trabajo.findByIdAndUpdate(
    id,
    {
      ...datos,
      fotos: sanitizarFotos(datos.fotos),
      cantFotos: datos.fotos?.length || 0,
      fechaModificacion: new Date(),
    },
    { new: true, runValidators: true }
  );
  if (!trabajo) return { statusCode: 404, msg: "Trabajo no encontrado" };
  return { statusCode: 200, trabajo };
};

const eliminarTrabajoService = async (id) => {
  const trabajo = await Trabajo.findByIdAndDelete(id);
  if (!trabajo) return { statusCode: 404, msg: "Trabajo no encontrado" };
  return { statusCode: 200, msg: "Trabajo eliminado correctamente" };
};

// Sincronización bulk: upsert por idLocal
const sincronizarTrabajosService = async (trabajos = []) => {
  const resultados = await Promise.allSettled(
    trabajos.map((t) =>
      Trabajo.findOneAndUpdate(
        { idLocal: t.idLocal },
        {
          ...t,
          fotos: sanitizarFotos(t.fotos),
          cantFotos: t.fotos?.length || 0,
          fechaModificacion: t.fechaModificacion ? new Date(t.fechaModificacion) : undefined,
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      )
    )
  );

  const exitosos = resultados.filter((r) => r.status === "fulfilled").length;
  const fallidos = resultados.filter((r) => r.status === "rejected").length;

  return {
    statusCode: 200,
    msg: `Sincronizados: ${exitosos}. Fallidos: ${fallidos}.`,
    exitosos,
    fallidos,
  };
};

const obtenerEstadisticasService = async () => {
  const [total, terminados, certificados, rechazados, superficie] = await Promise.all([
    Trabajo.countDocuments(),
    Trabajo.countDocuments({ estadoOperativo: { $in: ["Finalizado", "Terminado"] } }),
    Trabajo.countDocuments({ estadoAdmin: "Certificado" }),
    Trabajo.countDocuments({ estadoAdmin: "Rechazado" }),
    Trabajo.aggregate([{ $group: { _id: null, total: { $sum: "$superficie" } } }]),
  ]);

  return {
    statusCode: 200,
    estadisticas: {
      total,
      terminados,
      enProceso: await Trabajo.countDocuments({ estadoOperativo: "En proceso" }),
      sinIniciar: await Trabajo.countDocuments({ estadoOperativo: "Sin iniciar" }),
      certificados,
      rechazados,
      sinCertificar: await Trabajo.countDocuments({ estadoAdmin: "Sin certificar" }),
      superficieTotal: superficie[0]?.total || 0,
    },
  };
};

const importarTrabajosService = async (trabajos = []) => {
  const base = Date.now();
  const docs = trabajos.map((t, i) => ({
    ...t,
    idLocal: base + i,
    lat: t.lat ?? 0,
    lng: t.lng ?? 0,
    calle1: t.calle1 || 'Sin nombre',
    calle2: t.calle2 || '-',
    fotos: [],
    cantFotos: 0,
  }));

  const resultados = await Promise.allSettled(
    docs.map((d) => new Trabajo(d).save())
  );

  const importados = resultados.filter((r) => r.status === 'fulfilled').length;
  const fallidos = resultados.filter((r) => r.status === 'rejected').length;

  return {
    statusCode: importados > 0 ? 201 : 400,
    msg: `Importados: ${importados}. Fallidos: ${fallidos}.`,
    importados,
    fallidos,
  };
};

module.exports = {
  obtenerTodosService,
  obtenerPorIdService,
  crearTrabajoService,
  actualizarTrabajoService,
  eliminarTrabajoService,
  sincronizarTrabajosService,
  obtenerEstadisticasService,
  importarTrabajosService,
};
