const { Schema, model } = require("mongoose");

const AccesoLogSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: "usuarios",
    required: true,
  },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true },
  rol: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
}, {
  timestamps: false,
});

AccesoLogSchema.index({ usuario: 1, fecha: -1 });

const accesoLogModel = model("accesoLog", AccesoLogSchema);
module.exports = accesoLogModel;
