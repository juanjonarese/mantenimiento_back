require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const argon2 = require("argon2");
const usuariosModel = require("../models/usuarios.model");

// Los datos se pasan por variables de entorno para no dejar credenciales en el código:
// ADMIN_EMAIL=admin@empresa.com ADMIN_PASSWORD=Clave123 node scripts/crear-usuario.js
const NUEVO_USUARIO = {
  nombre: process.env.ADMIN_NOMBRE || "Admin",
  apellido: process.env.ADMIN_APELLIDO || "Sistema",
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  rol: "admin",
};

async function main() {
  if (!NUEVO_USUARIO.email || !NUEVO_USUARIO.password) {
    console.error(
      "Faltan datos. Ejecutá:\n" +
      "  ADMIN_EMAIL=admin@empresa.com ADMIN_PASSWORD=Clave123 node scripts/crear-usuario.js"
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_CONNECT);
  console.log("Conectado a MongoDB");

  const existente = await usuariosModel.findOne({ email: NUEVO_USUARIO.email });
  if (existente) {
    console.log("El usuario ya existe:", existente.email);
    process.exit(0);
  }

  const passwordHash = await argon2.hash(NUEVO_USUARIO.password);
  const usuario = await usuariosModel.create({
    nombre: NUEVO_USUARIO.nombre,
    apellido: NUEVO_USUARIO.apellido,
    email: NUEVO_USUARIO.email,
    password: passwordHash,
    rol: NUEVO_USUARIO.rol || "usuario",
  });

  console.log("Usuario creado:", usuario.email, "| ID:", usuario._id.toString());
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
