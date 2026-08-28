/**
 * Migra las fotos y videos que quedaron en Cloudinary hacia Cloudflare R2.
 *
 * Descarga cada archivo desde su URL pública de Cloudinary, lo sube a R2 con la
 * misma key (la ruta de Cloudinary después de /upload/vNNN/ ya es el mismo
 * formato pintura-vial/AAAA-MM/calle-y-calle/archivo) y actualiza driveUrl en
 * la base. No borra nada de Cloudinary.
 *
 * Uso:
 *   node scripts/migrar-cloudinary-a-r2.js --dry-run     # sólo muestra qué haría
 *   node scripts/migrar-cloudinary-a-r2.js --limit 5     # migra sólo 5 archivos
 *   node scripts/migrar-cloudinary-a-r2.js               # migra todo
 *
 * Es idempotente: las URLs que ya apuntan a R2 se saltean, así que se puede
 * volver a correr si algo falla a mitad de camino.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Trabajo = require('../models/trabajos.model');
const { subirAR2, r2Configurado } = require('../config/r2');

const DRY_RUN = process.argv.includes('--dry-run');
const LIMITE = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? Number(process.argv[i + 1]) : Infinity;
})();

const ES_CLOUDINARY = /^https?:\/\/res\.cloudinary\.com\//;

// De la URL de Cloudinary saca la key para R2:
// .../dxwkhay00/image/upload/v1780577376/pintura-vial/2026-06/x-y-z/123-14312.jpg
//                                        └──────────── key ────────────┘
function keyDesdeCloudinary(url) {
  const m = /\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+)$/.exec(new URL(url).pathname);
  return m ? decodeURIComponent(m[1]) : null;
}

function contentTypePorExtension(key, tipoGuardado) {
  if (tipoGuardado && tipoGuardado.includes('/')) return tipoGuardado;
  const ext = path.extname(key).toLowerCase().replace('.', '');
  const mapa = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
                 heic: 'image/heic', mp4: 'video/mp4', mov: 'video/quicktime' };
  return mapa[ext] || 'application/octet-stream';
}

async function migrarFoto(foto, ctx, resultado) {
  if (!foto || !foto.driveUrl || !ES_CLOUDINARY.test(foto.driveUrl)) return false;
  if (resultado.migradas + resultado.fallidas >= LIMITE) { resultado.pendientes++; return false; }

  const key = keyDesdeCloudinary(foto.driveUrl);
  if (!key) {
    console.error(`  ✗ ${ctx} — no se pudo derivar la key de ${foto.driveUrl}`);
    resultado.fallidas++;
    return false;
  }

  if (DRY_RUN) {
    console.log(`  · ${ctx} → ${key}`);
    resultado.migradas++;
    return false;
  }

  try {
    const r = await fetch(foto.driveUrl);
    if (!r.ok) throw new Error(`descarga HTTP ${r.status}`);
    const buffer = Buffer.from(await r.arrayBuffer());
    const contentType = r.headers.get('content-type') || contentTypePorExtension(key, foto.tipo);

    const nuevaUrl = await subirAR2(buffer, key, contentType);
    resultado.mapa.push({ antes: foto.driveUrl, despues: nuevaUrl, ctx });
    foto.driveUrl = nuevaUrl;
    foto.subido = true;

    const mb = (buffer.length / (1024 * 1024)).toFixed(2);
    console.log(`  ✓ ${ctx} — ${key} (${mb} MB)`);
    resultado.migradas++;
    return true;
  } catch (error) {
    console.error(`  ✗ ${ctx} — ${error.message}`);
    resultado.fallidas++;
    return false;
  }
}

(async () => {
  if (!r2Configurado()) {
    console.error('R2 no está configurado. Revisá las variables R2_* en el .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_CONNECT);
  console.log(`Conectado a MongoDB${DRY_RUN ? ' (DRY RUN, no se escribe nada)' : ''}\n`);

  const docs = await Trabajo.find({}, { idLocal: 1, calle1: 1, calle2: 1, fotos: 1, items: 1 }).lean();
  const resultado = { migradas: 0, fallidas: 0, pendientes: 0, docsActualizados: 0, mapa: [] };

  for (const doc of docs) {
    const etiqueta = `#${doc.idLocal} ${doc.calle1 || ''} y ${doc.calle2 || ''}`.trim();
    let cambio = false;
    let anuncio = false;

    const anunciar = () => { if (!anuncio) { console.log(etiqueta); anuncio = true; } };

    for (const [i, foto] of (doc.fotos || []).entries()) {
      if (foto && ES_CLOUDINARY.test(foto.driveUrl || '')) anunciar();
      cambio = (await migrarFoto(foto, `fotos[${i}]`, resultado)) || cambio;
    }
    for (const [j, item] of (doc.items || []).entries()) {
      for (const [i, foto] of (item.fotos || []).entries()) {
        if (foto && ES_CLOUDINARY.test(foto.driveUrl || '')) anunciar();
        cambio = (await migrarFoto(foto, `items[${j}].fotos[${i}]`, resultado)) || cambio;
      }
    }

    if (cambio && !DRY_RUN) {
      await Trabajo.updateOne({ _id: doc._id }, { $set: { fotos: doc.fotos, items: doc.items } });
      resultado.docsActualizados++;
    }
  }

  if (resultado.mapa.length) {
    const archivo = path.join(__dirname, `migracion-r2-${Date.now()}.json`);
    fs.writeFileSync(archivo, JSON.stringify(resultado.mapa, null, 2));
    console.log(`\nMapa de URLs viejas → nuevas guardado en ${archivo}`);
  }

  console.log('\n──────── Resumen ────────');
  console.log(`Archivos migrados:   ${resultado.migradas}`);
  console.log(`Fallidos:            ${resultado.fallidas}`);
  if (resultado.pendientes) console.log(`Sin tocar (--limit):  ${resultado.pendientes}`);
  console.log(`Trabajos guardados:  ${resultado.docsActualizados}`);
  console.log('Los originales siguen en Cloudinary; no se borró nada.');

  await mongoose.disconnect();
})();
