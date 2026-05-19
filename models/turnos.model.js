const { Schema, model } = require("mongoose");

const MaterialTurnoSchema = new Schema({
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  unidad: { type: String, default: "litros" },
}, { _id: false });

const TurnoSchema = new Schema({
  supervisor: { type: Schema.Types.ObjectId, ref: "usuarios", required: true },
  fechaInicio: { type: Date, default: Date.now },
  fechaFin: { type: Date },
  estado: { type: String, enum: ["abierto", "cerrado"], default: "abierto" },
  materiales: [MaterialTurnoSchema],
  observaciones: { type: String, default: "" },
}, { timestamps: true });

TurnoSchema.index({ supervisor: 1, estado: 1 });
TurnoSchema.index({ fechaInicio: -1 });

module.exports = model("turnos", TurnoSchema);
