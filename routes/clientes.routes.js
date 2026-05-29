const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require("../middelware/auth.middleware");
const { obtenerClientes, obtenerTodosClientes, crearCliente, actualizarCliente, toggleCliente } = require("../controllers/clientes.controller");

router.get("/",        verificarToken, obtenerClientes);
router.get("/todos",   verificarToken, verificarAdmin, obtenerTodosClientes);
router.post("/",       verificarToken, verificarAdmin, crearCliente);
router.put("/:id",     verificarToken, verificarAdmin, actualizarCliente);
router.patch("/:id/toggle", verificarToken, verificarAdmin, toggleCliente);

module.exports = router;
