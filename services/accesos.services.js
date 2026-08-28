const accesoLogModel = require("../models/accesoLog.model");

const obtenerAccesosService = async (filtros = {}) => {
  try {
    const query = {};

    if (filtros.usuario) query.usuario = filtros.usuario;

    if (filtros.desde || filtros.hasta) {
      query.fecha = {};
      if (filtros.desde) query.fecha.$gte = new Date(`${filtros.desde}T00:00:00`);
      if (filtros.hasta) query.fecha.$lte = new Date(`${filtros.hasta}T23:59:59.999`);
    }

    const accesos = await accesoLogModel.find(query).sort({ fecha: -1 }).limit(2000);

    return { accesos, statusCode: 200 };
  } catch (error) {
    console.error("Error en obtenerAccesosService:", error);
    return { accesos: [], statusCode: 500 };
  }
};

module.exports = { obtenerAccesosService };
