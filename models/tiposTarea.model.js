const { Schema, model } = require("mongoose");

const TipoTareaSchema = new Schema({
  nombre: { type: String, required: true, trim: true, unique: true },
  unidad: { type: String, default: "m²", trim: true },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = model("tipos_tarea", TipoTareaSchema);
