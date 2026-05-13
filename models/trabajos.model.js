const { Schema, model } = require("mongoose");

const FotoSchema = new Schema({
  nombre: { type: String },
  tipo: { type: String },
  driveUrl: { type: String, default: null },
  subido: { type: Boolean, default: false },
}, { _id: false });

const TrabajoSchema = new Schema({
  idLocal: { type: Number, required: true, unique: true },
  fechaCarga: { type: Date, required: true },
  fechaModificacion: { type: Date },
  usuario: { type: String, required: true, trim: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  calle1: { type: String, required: true, trim: true },
  calle2: { type: String, required: true, trim: true },
  tipoTrabajo: {
    type: String,
    required: true,
    enum: ['Senda peatonal', 'Cordón', 'Rampa', 'Ochava', 'Flecha', 'Línea divisoria', 'Estacionamiento', 'Otros'],
  },
  largo: { type: Number, required: true },
  ancho: { type: Number, required: true },
  cantidad: { type: Number, required: true },
  superficie: { type: Number, required: true },
  estadoOperativo: {
    type: String,
    enum: ['Sin iniciar', 'En proceso', 'Finalizado'],
    default: 'Sin iniciar',
  },
  estadoAdmin: {
    type: String,
    enum: ['Sin certificar', 'Certificado'],
    default: 'Sin certificar',
  },
  observaciones: { type: String, default: '' },
  linkDrive: { type: String, default: '' },
  linkMyMaps: { type: String, default: '' },
  fotos: [FotoSchema],
  cantFotos: { type: Number, default: 0 },
}, { timestamps: true });

TrabajoSchema.index({ usuario: 1 });
TrabajoSchema.index({ estadoOperativo: 1 });
TrabajoSchema.index({ estadoAdmin: 1 });
TrabajoSchema.index({ fechaCarga: -1 });

module.exports = model("trabajos", TrabajoSchema);
