const Trabajo = require("../models/trabajos.model");
const { Types } = require("mongoose");
const { borrarDeR2PorUrl } = require("../config/r2");

// Junta todas las URLs de fotos/videos de un trabajo (nivel trabajo + items)
function urlsDeFotos(trabajo) {
  const urls = [];
  (trabajo.fotos || []).forEach((f) => f?.driveUrl && urls.push(f.driveUrl));
  (trabajo.items || []).forEach((it) =>
    (it.fotos || []).forEach((f) => f?.driveUrl && urls.push(f.driveUrl))
  );
  return urls;
}

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
  if (filtros.turno && Types.ObjectId.isValid(filtros.turno)) query.turno = new Types.ObjectId(filtros.turno);
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

  // Borra los archivos en R2 (best-effort). Esperamos a que termine porque en
  // serverless el proceso puede cortarse al responder. Las URLs que no sean de
  // R2 (Cloudinary viejas) se ignoran solas.
  if ((process.env.STORAGE_DRIVER || "").toLowerCase() === "r2") {
    await Promise.allSettled(urlsDeFotos(trabajo).map(borrarDeR2PorUrl));
  }

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

const normStr = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const matchMat = (catalogName, trabajoName) => {
  const na = normStr(catalogName);
  const nb = normStr(trabajoName);
  if (na === nb) return true;
  const longestKey = na.split(/\s+/).filter((w) => w.length >= 6).sort((x, y) => y.length - x.length)[0];
  return longestKey ? nb.includes(longestKey) : false;
};

const obtenerConsumoMaterialesService = async () => {
  try {
    const Material = require("../models/materialCatalogo.model");
    const [trabajos, catalogo] = await Promise.all([
      Trabajo.find({}, { materiales: 1, items: 1 }).lean(),
      Material.find({ activo: true }, { nombre: 1, unidad: 1 }).lean(),
    ]);
    const mapa = {};
    trabajos.forEach((t) => {
      const todos = [
        ...(t.materiales || []),
        ...(t.items || []).flatMap((i) => i.materiales || []),
      ];
      todos.forEach(({ nombre, cantidad, unidad }) => {
        if (!nombre) return;
        const catEntry = catalogo.find((c) => normStr(c.nombre) === normStr(nombre))
          || catalogo.find((c) => matchMat(c.nombre, nombre));
        const k = catEntry ? catEntry.nombre : nombre.trim();
        const u = catEntry ? catEntry.unidad : (unidad || '');
        if (!mapa[k]) mapa[k] = { nombre: k, unidad: u, cantidad: 0 };
        mapa[k].cantidad += cantidad || 0;
      });
    });
    const consumo = Object.values(mapa)
      .map((m) => ({ ...m, cantidad: parseFloat(m.cantidad.toFixed(2)) }))
      .sort((a, b) => b.cantidad - a.cantidad);
    return { consumo, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerConsumoMaterialesService:", error);
    return { consumo: [], statusCode: 500 };
  }
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
  obtenerConsumoMaterialesService,
};
