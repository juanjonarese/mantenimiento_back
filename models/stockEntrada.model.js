const { Schema, model } = require("mongoose");

const StockEntradaSchema = new Schema({
  material:    { type: Schema.Types.ObjectId, ref: "materiales_catalogo", required: true },
  cantidad:    { type: Number, required: true },
  fecha:       { type: Date, default: Date.now },
  descripcion: { type: String, default: "", trim: true },
}, { timestamps: true });

module.exports = model("stock_entradas", StockEntradaSchema);
