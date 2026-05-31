const { Schema, model } = require("mongoose");

const MaterialCatalogoSchema = new Schema({
  codigo: { type: String, default: "", trim: true },
  nombre: { type: String, required: true, trim: true },
  stock:  { type: Number, default: 0 },
  unidad: { type: String, default: "litros", trim: true },
  tamano: { type: String, default: "", trim: true },
  activo:     { type: Boolean, default: true },
  tiposTarea: [{ type: String, trim: true }],
}, { timestamps: true });

module.exports = model("materiales_catalogo", MaterialCatalogoSchema);
