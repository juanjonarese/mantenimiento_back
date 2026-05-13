require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./db/config.db");

const app = express();
const PORT = process.env.PORT || 3001;

// CORS abierto — la seguridad la maneja el JWT en cada endpoint
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para asegurar conexión a MongoDB en cada request (importante para Vercel serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Error en middleware de conexión:", error);
    // Continuar sin conexión - el request manejará el error si necesita DB
    next();
  }
});

// Rutas
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/trabajos", require("./routes/trabajos.routes"));

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({
    msg: "API Sistema de Usuarios funcionando correctamente",
    version: "1.0.0"
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ msg: "Ruta no encontrada" });
});

// Conectar a MongoDB y luego iniciar servidor
const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.warn("⚠️  MongoDB no disponible, pero el servidor continuará");
  }

  // Iniciar servidor siempre (con o sin MongoDB)
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📡 http://localhost:${PORT}`);
    if (!process.env.MONGO_CONNECT) {
      console.warn("⚠️  MONGO_CONNECT no configurado en .env");
    }
  });
};

startServer();

module.exports = app;
