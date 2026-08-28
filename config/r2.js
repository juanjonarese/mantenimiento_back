const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Cloudflare R2 es compatible con la API de Amazon S3.
// region 'auto' es lo que R2 espera; el endpoint apunta a tu cuenta de R2.
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function r2Configurado() {
  return Boolean(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_URL
  );
}

// Sube un buffer a R2 y devuelve la URL pública (subdominio r2.dev o dominio propio).
async function subirAR2(buffer, key, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  const base = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
  return `${base}/${key}`;
}

// Borra un objeto de R2 a partir de su key.
async function borrarDeR2(key) {
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
  }));
}

// Extrae la key de una URL pública de R2. Devuelve null si la URL no es de R2
// (ej: una URL vieja de Cloudinary), para no intentar borrarla.
function keyDesdeUrl(url) {
  if (!url || !process.env.R2_PUBLIC_URL) return null;
  const base = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
  if (!url.startsWith(base + '/')) return null;
  return decodeURIComponent(url.slice(base.length + 1));
}

// Borra un archivo de R2 a partir de su URL pública. Devuelve true si lo borró.
async function borrarDeR2PorUrl(url) {
  const key = keyDesdeUrl(url);
  if (!key) return false;
  await borrarDeR2(key);
  return true;
}

module.exports = { r2, r2Configurado, subirAR2, borrarDeR2, keyDesdeUrl, borrarDeR2PorUrl };
