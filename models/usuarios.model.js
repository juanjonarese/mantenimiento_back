const { Schema, model } = require("mongoose");

const UsuarioSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },

  apellido: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
    trim: true,
  },

  rol: {
    type: String,
    enum: ["admin", "supervisor", "usuario"],
    default: "supervisor",
  },
}, {
  timestamps: true,
});

const usuariosModel = model("usuarios", UsuarioSchema);
module.exports = usuariosModel;
