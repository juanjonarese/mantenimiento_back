require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./db/config.db");

const app = express();
const PORT = process.env.PORT || 3001;

// Preflight OPTIONS — debe ser lo primero, antes de cualquier middleware
const ORIGENES_PERMITIDOS = [
  process.env.FRONT_URL,
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ORIGENES_PERMITIDOS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

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

// Rate limiting en endpoints de autenticación
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { msg: "Demasiados intentos. Intentá de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/usuarios/login",    loginLimiter);
app.use("/api/usuarios/registro", loginLimiter);

// Rutas
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/trabajos", require("./routes/trabajos.routes"));
app.use("/api/turnos", require("./routes/turnos.routes"));
app.use("/api/tipos-tarea", require("./routes/tiposTarea.routes"));
app.use("/api/materiales", require("./routes/materialCatalogo.routes"));
app.use("/api/clientes",  require("./routes/clientes.routes"));
app.use("/api/fotos",    require("./routes/fotos.routes"));

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
