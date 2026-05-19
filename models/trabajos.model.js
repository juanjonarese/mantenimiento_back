const { Schema, model } = require("mongoose");

const FotoSchema = new Schema({
  nombre: { type: String },
  tipo: { type: String },
  driveUrl: { type: String, default: null },
  subido: { type: Boolean, default: false },
}, { _id: false });

const MaterialSchema = new Schema({
  nombre: { type: String },
  cantidad: { type: Number },
  unidad: { type: String },
}, { _id: false });

const ItemSchema = new Schema({
  tipoTrabajo: { type: String },
  largo: { type: Number },
  ancho: { type: Number },
  cantidad: { type: Number },
  superficie: { type: Number },
  materiales: [MaterialSchema],
}, { _id: false });

const TrabajoSchema = new Schema({
  idLocal: { type: Number, required: true, unique: true },
  fechaCarga: { type: Date, required: true },
  fechaModificacion: { type: Date },
  usuario: { type: String, default: '', trim: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  calle1: { type: String, required: true, trim: true },
  calle2: { type: String, required: true, trim: true },

  // Formato nuevo: múltiples items por trabajo
  items: [ItemSchema],
  materiales: [MaterialSchema],

  // Campos legacy (backward compat con datos viejos)
  tipoTrabajo: { type: String },
  largo: { type: Number },
  ancho: { type: Number },
  cantidad: { type: Number },

  superficie: { type: Number, default: 0 },
  estadoOperativo: {
    type: String,
    enum: ['Sin iniciar', 'En proceso', 'Finalizado', 'Terminado'],
    default: 'Sin iniciar',
  },
  estadoAdmin: {
    type: String,
    enum: ['Sin certificar', 'En revisión', 'Certificado', 'Rechazado'],
    default: 'Sin certificar',
  },
  motivoRechazo: { type: String },
  documentacionCertificacion: { type: String },
  notasCertificacion: { type: String },
  fechaCertificacion: { type: Date },
  emailRevision: { type: String },
  docRevision: { type: String },

  turno: { type: require("mongoose").Schema.Types.ObjectId, ref: "turnos", default: null },
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
