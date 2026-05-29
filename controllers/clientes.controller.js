const {
  obtenerClientesService,
  obtenerTodosClientesService,
  crearClienteService,
  actualizarClienteService,
  toggleClienteService,
} = require("../services/clientes.services");

const obtenerClientes = async (req, res) => {
  try {
    const { clientes, statusCode } = await obtenerClientesService();
    res.status(statusCode).json({ clientes });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const obtenerTodosClientes = async (req, res) => {
  try {
    const { clientes, statusCode } = await obtenerTodosClientesService();
    res.status(statusCode).json({ clientes });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const crearCliente = async (req, res) => {
  try {
    const resultado = await crearClienteService(req.body);
    if (resultado.msg && !resultado.cliente) return res.status(resultado.statusCode).json({ msg: resultado.msg });
    res.status(resultado.statusCode).json({ cliente: resultado.cliente });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const actualizarCliente = async (req, res) => {
  try {
    const resultado = await actualizarClienteService(req.params.id, req.body);
    if (resultado.msg && !resultado.cliente) return res.status(resultado.statusCode).json({ msg: resultado.msg });
    res.status(resultado.statusCode).json({ cliente: resultado.cliente });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

const toggleCliente = async (req, res) => {
  try {
    const resultado = await toggleClienteService(req.params.id);
    if (resultado.msg && !resultado.cliente) return res.status(resultado.statusCode).json({ msg: resultado.msg });
    res.status(resultado.statusCode).json({ cliente: resultado.cliente });
  } catch (error) {
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

module.exports = { obtenerClientes, obtenerTodosClientes, crearCliente, actualizarCliente, toggleCliente };
