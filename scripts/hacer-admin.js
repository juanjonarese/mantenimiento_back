require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const usuariosModel = require("../models/usuarios.model");

// Uso: ADMIN_EMAIL=usuario@empresa.com node scripts/hacer-admin.js
const EMAIL = process.env.ADMIN_EMAIL;

async function main() {
  if (!EMAIL) {
    console.error("Falta el email. Ejecutá:\n  ADMIN_EMAIL=usuario@empresa.com node scripts/hacer-admin.js");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_CONNECT);
  console.log("Conectado a MongoDB");

  const resultado = await usuariosModel.findOneAndUpdate(
    { email: EMAIL },
    { rol: "admin" },
    { new: true }
  );

  if (!resultado) {
    console.log("Usuario no encontrado:", EMAIL);
  } else {
    console.log(`Usuario ${resultado.email} actualizado a rol: ${resultado.rol}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
