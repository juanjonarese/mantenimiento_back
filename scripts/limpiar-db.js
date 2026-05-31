require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const readline = require("readline");

const COLECCIONES = [
  { nombre: "trabajos", modelo: require("../models/trabajos.model") },
];

function preguntar(msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(msg, (r) => { rl.close(); resolve(r.trim()); }));
}

async function main() {
  await mongoose.connect(process.env.MONGO_CONNECT);
  console.log("✅ Conectado a MongoDB\n");

  console.log("⚠️  Se van a ELIMINAR TODOS los documentos de:");
  COLECCIONES.forEach((c) => console.log(`   • ${c.nombre}`));
  console.log("\n✅  Se conserva todo lo demás: usuarios, clientes, materiales, turnos, tipos de tarea\n");

  const resp = await preguntar('Escribí "CONFIRMAR" para continuar: ');
  if (resp !== "CONFIRMAR") {
    console.log("❌ Cancelado.");
    process.exit(0);
  }

  console.log("\nEliminando...");
  for (const { nombre, modelo } of COLECCIONES) {
    const { deletedCount } = await modelo.deleteMany({});
    console.log(`   ✓ ${nombre}: ${deletedCount} documentos eliminados`);
  }

  console.log("\n✅ Base de datos limpia.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
