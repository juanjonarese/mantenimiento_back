require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./db/config.db");

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — al tope, antes de cualquier operación async
const corsOptions = {
  origin: "https://mantenimiento-mocha.vercel.app",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para asegurar conexión a MongoDB en cada request (importante para Vercel serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Error en middleware de conexión:", error);
    res.status(503).json({ msg: "Servicio temporalmente no disponible. Intenta nuevamente." });
  }
});

// Rutas
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/trabajos", require("./routes/trabajos.routes"));

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ msg: "API Pintura Vial funcionando correctamente", version: "1.0.0" });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ msg: "Ruta no encontrada" });
});

// En desarrollo: iniciar servidor HTTP normal
// En producción (Vercel): solo exportar el app, Vercel maneja el servidor
if (process.env.NODE_ENV !== "production") {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
        console.log(`📡 http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("❌ Error al iniciar el servidor:", error);
      process.exit(1);
    });
}

module.exports = app;
