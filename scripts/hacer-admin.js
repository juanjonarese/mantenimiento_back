require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const usuariosModel = require("../models/usuarios.model");

const EMAIL = "juanjo.narese@gmail.com";

async function main() {
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
