const { Schema, model } = require("mongoose");

const ClienteSchema = new Schema({
  nombre:    { type: String, required: true, trim: true },
  cuit:      { type: String, required: true, trim: true, unique: true },
  contacto:  { type: String, default: '', trim: true },
  telefono:  { type: String, default: '', trim: true },
  email:     { type: String, default: '', trim: true },
  direccion: { type: String, default: '', trim: true },
  activo:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = model("clientes", ClienteSchema);
