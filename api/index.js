require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const connectDB = require("../db/config.db");

const app = express();

// CORS manual — funciona en cualquier entorno serverless
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB por request (patrón serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Error DB:", error.message);
    next();
  }
});

// Rutas
app.use("/api/usuarios", require("../routes/usuarios.routes"));
app.use("/api/trabajos", require("../routes/trabajos.routes"));

app.get("/", (req, res) => {
  res.json({ msg: "API Pintura Vial funcionando", version: "1.0.0" });
});

app.use((req, res) => {
  res.status(404).json({ msg: "Ruta no encontrada" });
});

module.exports = app;
