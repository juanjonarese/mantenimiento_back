const { obtenerAccesosService } = require("../services/accesos.services");

const obtenerAccesos = async (req, res) => {
  try {
    const { usuario, desde, hasta } = req.query;
    const { statusCode, accesos } = await obtenerAccesosService({ usuario, desde, hasta });
    res.status(statusCode).json({ accesos });
  } catch (error) {
    console.error("Error en obtenerAccesos:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

module.exports = { obtenerAccesos };
