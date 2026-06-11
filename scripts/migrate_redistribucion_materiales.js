require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { EJSON } = require("bson");

const Trabajo = require("../models/trabajos.model");
const Material = require("../models/materialCatalogo.model");
const StockEntrada = require("../models/stockEntrada.model");

const APLICAR = process.argv.includes("--apply");

const normStr = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

const matchMat = (catalogName, trabajoName) => {
  const na = normStr(catalogName);
  const nb = normStr(trabajoName);
  if (na === nb) return true;
  const longestKey = na.split(/\s+/).filter((w) => w.length >= 6).sort((x, y) => y.length - x.length)[0];
  return longestKey ? nb.includes(longestKey) : false;
};

const findCat = (catalogo, keywords) =>
  catalogo.find((c) => keywords.every((k) => normStr(c.nombre).includes(k)));

// tipos reales que existen en los trabajos: SENDAS, RAMPAS, CORDONES, LINEA DETENCION
const TARGET_DEFS = [
  { keywords: ["termoplastica", "blanca"], consumido: 1936, disponible: 761, basis: ["SENDAS", "LINEA DETENCION"] },
  { keywords: ["microesfera", "vidrio"],   consumido: 122,  disponible: 45,  basis: ["SENDAS", "LINEA DETENCION"] },
  { keywords: ["acrilica", "amarilla"],    consumido: 2368, disponible: 1032, basis: ["CORDONES", "RAMPAS"] },
  { keywords: ["imprimacion"],             consumido: 1280, disponible: 700, basis: ["SENDAS", "LINEA DETENCION"] },
  { keywords: ["termoplastica", "amarilla"], consumido: 0,  disponible: 40,  basis: [] },
  { keywords: ["acrilica", "blanca"],      consumido: 485,  disponible: 1035, basis: ["CORDONES"] },
  { keywords: ["diluyente"],               consumido: 0,    disponible: 160, basis: [] },
];

const REAL_TIPOS = ["SENDAS", "RAMPAS", "CORDONES", "LINEA DETENCION"];

function m2ParaTipos(t, tipos) {
  if (!tipos.length) return 0;
  if (Array.isArray(t.items) && t.items.length) {
    return t.items.reduce((s, it) => s + (tipos.includes(it.tipoTrabajo) ? (it.superficie || 0) : 0), 0);
  }
  return tipos.includes(t.tipoTrabajo) ? (t.superficie || 0) : 0;
}

function consumoActual(trabajos, catalogo) {
  const mapa = {};
  trabajos.forEach((t) => {
    const todos = [
      ...(t.materiales || []),
      ...(t.items || []).flatMap((i) => i.materiales || []),
    ];
    todos.forEach(({ nombre, cantidad }) => {
      if (!nombre) return;
      const catEntry = catalogo.find((c) => normStr(c.nombre) === normStr(nombre))
        || catalogo.find((c) => matchMat(c.nombre, nombre));
      const k = catEntry ? catEntry.nombre : nombre.trim();
      if (!mapa[k]) mapa[k] = 0;
      mapa[k] += cantidad || 0;
    });
  });
  return mapa;
}

async function main() {
  console.log("🔌 Conectando a MongoDB...");
  await mongoose.connect(process.env.MONGO_CONNECT, { serverSelectionTimeoutMS: 15000 });
  console.log("✅ Conectado a MongoDB\n");

  const [trabajos, catalogo, stockEntradas] = await Promise.all([
    Trabajo.find({}).lean(),
    Material.find({}).lean(),
    StockEntrada.find({}).lean(),
  ]);

  console.log(`📋 ${trabajos.length} trabajos, ${catalogo.length} materiales en catálogo, ${stockEntradas.length} entradas de stock\n`);

  // m2 totales por tipo real
  const m2PorTipo = {};
  REAL_TIPOS.forEach((tipo) => {
    m2PorTipo[tipo] = trabajos.reduce((s, t) => s + m2ParaTipos(t, [tipo]), 0);
  });
  console.log("📐 m² totales por tipo real:");
  REAL_TIPOS.forEach((tipo) => console.log(`   ${tipo}: ${m2PorTipo[tipo].toFixed(2)}`));
  console.log("");

  // resolver catálogo + cargado actual + consumo actual por target
  const cargadoPorMaterial = {};
  stockEntradas.forEach((e) => {
    const id = String(e.material);
    cargadoPorMaterial[id] = (cargadoPorMaterial[id] || 0) + (e.cantidad || 0);
  });

  const consumoMap = consumoActual(trabajos, catalogo);

  const targets = TARGET_DEFS.map((def) => {
    const cat = findCat(catalogo, def.keywords);
    if (!cat) {
      console.warn(`⚠️  No se encontró material de catálogo para keywords [${def.keywords.join(", ")}]`);
      return null;
    }
    const totalBasis = def.basis.reduce((s, tipo) => s + (m2PorTipo[tipo] || 0), 0);
    const cargadoActual = parseFloat((cargadoPorMaterial[String(cat._id)] || 0).toFixed(2));
    const consumidoActual = parseFloat((consumoMap[cat.nombre] || 0).toFixed(2));
    const cargadoTarget = def.disponible + def.consumido;
    const ajusteStock = parseFloat((cargadoTarget - cargadoActual).toFixed(2));
    return { ...def, cat, totalBasis, cargadoActual, consumidoActual, cargadoTarget, ajusteStock };
  }).filter(Boolean);

  console.log("📦 Resumen por material (estado actual vs objetivo):");
  targets.forEach((tg) => {
    console.log(`\n   ${tg.cat.nombre} (${tg.cat.unidad}) [${tg.cat._id}]`);
    console.log(`     Basis m²: [${tg.basis.join(", ") || "-"}] = ${tg.totalBasis.toFixed(2)}`);
    console.log(`     Consumido actual: ${tg.consumidoActual}  -> objetivo: ${tg.consumido}`);
    console.log(`     Cargado actual:   ${tg.cargadoActual}  -> objetivo: ${tg.cargadoTarget} (Disponible obj: ${tg.disponible})`);
    console.log(`     Ajuste de stock a aplicar: ${tg.ajusteStock >= 0 ? "+" : ""}${tg.ajusteStock}`);
  });

  // ---- Redistribución de cantidades por trabajo ----
  // Para cada target con consumido>0 y totalBasis>0, calcular cantidad por trabajo
  const cantidadesPorTrabajo = {}; // _id -> { catNombre: cantidad }
  trabajos.forEach((t) => { cantidadesPorTrabajo[String(t._id)] = {}; });

  targets.forEach((tg) => {
    if (tg.consumido <= 0 || tg.totalBasis <= 0) return;
    const tasa = tg.consumido / tg.totalBasis;
    let mayor = null;
    let suma = 0;
    trabajos.forEach((t) => {
      const m2 = m2ParaTipos(t, tg.basis);
      if (m2 <= 0) return;
      const cantidad = parseFloat((m2 * tasa).toFixed(2));
      if (cantidad <= 0) return;
      cantidadesPorTrabajo[String(t._id)][tg.cat.nombre] = cantidad;
      suma += cantidad;
      if (!mayor || cantidad > mayor.cantidad) mayor = { id: String(t._id), cantidad };
    });
    // corrección de redondeo: ajustar el trabajo con mayor cantidad para que la suma sea exacta
    const diff = parseFloat((tg.consumido - suma).toFixed(2));
    if (diff !== 0 && mayor) {
      cantidadesPorTrabajo[mayor.id][tg.cat.nombre] = parseFloat((cantidadesPorTrabajo[mayor.id][tg.cat.nombre] + diff).toFixed(2));
    }
  });

  // ---- Construir nuevo array de materiales por trabajo ----
  const targetCatIds = new Set(targets.map((tg) => String(tg.cat._id)));
  const updates = trabajos.map((t) => {
    const existentes = [
      ...(t.materiales || []),
    ];
    // conservar entradas que NO correspondan a ninguno de los materiales objetivo
    const conservadas = existentes.filter((m) => {
      if (!m.nombre) return true;
      const catEntry = catalogo.find((c) => normStr(c.nombre) === normStr(m.nombre))
        || catalogo.find((c) => matchMat(c.nombre, m.nombre));
      return !(catEntry && targetCatIds.has(String(catEntry._id)));
    });
    // agregar las nuevas cantidades calculadas
    const nuevas = [];
    targets.forEach((tg) => {
      const cant = cantidadesPorTrabajo[String(t._id)][tg.cat.nombre];
      if (cant && cant > 0) {
        nuevas.push({ nombre: tg.cat.nombre, cantidad: cant, unidad: tg.cat.unidad });
      }
    });
    return { _id: t._id, materiales: [...conservadas, ...nuevas] };
  });

  // ---- Verificación: recalcular consumo con los nuevos materiales ----
  const trabajosNuevos = trabajos.map((t) => {
    const u = updates.find((x) => String(x._id) === String(t._id));
    return { ...t, materiales: u.materiales };
  });
  const consumoNuevo = consumoActual(trabajosNuevos, catalogo);

  console.log("\n\n🔄 Verificación post-redistribución (calculado, sin aplicar todavía):");
  targets.forEach((tg) => {
    const nuevoConsumo = parseFloat((consumoNuevo[tg.cat.nombre] || 0).toFixed(2));
    const nuevoDisponible = parseFloat((tg.cargadoTarget - nuevoConsumo).toFixed(2));
    const ok = Math.abs(nuevoConsumo - tg.consumido) < 0.01 && Math.abs(nuevoDisponible - tg.disponible) < 0.01;
    console.log(`   ${tg.cat.nombre}: Consumido ${nuevoConsumo} (obj ${tg.consumido}) | Disponible ${nuevoDisponible} (obj ${tg.disponible}) ${ok ? "✅" : "❌"}`);
  });

  const trabajosAfectados = updates.filter((u, i) => JSON.stringify(u.materiales) !== JSON.stringify(trabajos[i].materiales || [])).length;
  console.log(`\n📝 Trabajos cuyo array 'materiales' cambiaría: ${trabajosAfectados} de ${trabajos.length}`);

  if (!APLICAR) {
    console.log("\n🟡 DRY RUN (no se modificó la base de datos). Ejecutá con --apply para aplicar los cambios (incluye backup previo).");
    await mongoose.disconnect();
    return;
  }

  // ---- APLICAR ----
  console.log("\n🚀 Aplicando cambios...");

  // 1. Backup de trabajos
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, "../backups", `${timestamp}_pre-redistribucion`);
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(path.join(backupDir, "trabajos.json"), EJSON.stringify(trabajos, null, 2));
  fs.writeFileSync(path.join(backupDir, "stock_entradas.json"), EJSON.stringify(stockEntradas, null, 2));
  console.log(`   ✓ Backup guardado en: ${backupDir}`);

  // 2. Actualizar materiales de cada trabajo
  let actualizados = 0;
  for (const u of updates) {
    await Trabajo.findByIdAndUpdate(u._id, { materiales: u.materiales });
    actualizados++;
  }
  console.log(`   ✓ ${actualizados} trabajos actualizados`);

  // 3. Ajustes de stock
  let ajustesCreados = 0;
  for (const tg of targets) {
    if (tg.ajusteStock === 0) continue;
    await StockEntrada.create({
      material: tg.cat._id,
      cantidad: tg.ajusteStock,
      fecha: new Date(),
      descripcion: "Ajuste de corrección de inventario (redistribución de materiales)",
    });
    ajustesCreados++;
    console.log(`   ✓ Ajuste de stock creado para ${tg.cat.nombre}: ${tg.ajusteStock >= 0 ? "+" : ""}${tg.ajusteStock} ${tg.cat.unidad}`);
  }
  console.log(`   ✓ ${ajustesCreados} ajustes de stock creados`);

  // 4. Verificación final contra la DB
  const [trabajosFinal, stockFinal] = await Promise.all([
    Trabajo.find({}).lean(),
    StockEntrada.find({}).lean(),
  ]);
  const consumoFinal = consumoActual(trabajosFinal, catalogo);
  const cargadoFinal = {};
  stockFinal.forEach((e) => {
    const id = String(e.material);
    cargadoFinal[id] = (cargadoFinal[id] || 0) + (e.cantidad || 0);
  });

  console.log("\n✅ Verificación final (datos en la base de datos):");
  targets.forEach((tg) => {
    const consumido = parseFloat((consumoFinal[tg.cat.nombre] || 0).toFixed(2));
    const cargado = parseFloat((cargadoFinal[String(tg.cat._id)] || 0).toFixed(2));
    const disponible = parseFloat((cargado - consumido).toFixed(2));
    console.log(`   ${tg.cat.nombre}: Cargado ${cargado} | Consumido ${consumido} (obj ${tg.consumido}) | Disponible ${disponible} (obj ${tg.disponible})`);
  });

  console.log("\n🎉 Migración completa.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
