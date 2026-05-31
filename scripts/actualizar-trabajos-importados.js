require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Trabajo = require("../models/trabajos.model");
const Cliente = require("../models/clientes.model");

async function main() {
  await mongoose.connect(process.env.MONGO_CONNECT);
  console.log("✅ Conectado a MongoDB\n");

  const cliente = await Cliente.findOne({
    nombre: { $regex: /municipalidad\s*smt/i },
  });

  if (!cliente) {
    console.error("❌ No se encontró el cliente 'MUNICIPALIDAD SMT'. Verificá el nombre exacto.");
    const todos = await Cliente.find({}, "nombre");
    console.log("Clientes disponibles:", todos.map((c) => c.nombre).join(", "));
    process.exit(1);
  }

  console.log(`✅ Cliente encontrado: ${cliente.nombre} (${cliente._id})\n`);

  const { modifiedCount } = await Trabajo.updateMany(
    {},
    {
      $set: {
        estadoOperativo: "Terminado",
        estadoAdmin:     "Certificado",
        clienteId:       cliente._id.toString(),
        clienteNombre:   cliente.nombre,
      },
    }
  );

  console.log(`✅ ${modifiedCount} trabajos actualizados.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
