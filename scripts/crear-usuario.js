require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const argon2 = require("argon2");
const usuariosModel = require("../models/usuarios.model");

const NUEVO_USUARIO = {
  nombre: "Juanjo",
  apellido: "Narese",
  email: "juanjo.narese@gmail.com",
  password: "Admin159",
  rol: "admin",
};

async function main() {
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
