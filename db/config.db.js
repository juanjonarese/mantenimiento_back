const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("✅ Usando conexión existente");
    return Promise.resolve();
  }

  if (mongoose.connection.readyState === 2) {
    console.log("⏳ Conexión en progreso, esperando...");
    return new Promise((resolve, reject) => {
      mongoose.connection.once("connected", () => {
        isConnected = true;
        resolve();
      });
      mongoose.connection.once("error", reject);
    });
  }

  try {
    console.log("🔌 Iniciando nueva conexión a MongoDB...");

    const options = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGO_CONNECT, options);

    isConnected = mongoose.connection.readyState === 1;
    console.log("✅ MongoDB conectado exitosamente");
  } catch (error) {
    console.error("❌ Error al conectar MongoDB:", error.message);
    console.warn("⚠️  El servidor continuará sin conexión a MongoDB");
    isConnected = false;
    // No lanzar error - permitir que el servidor inicie sin DB
  }
};

module.exports = connectDB;
