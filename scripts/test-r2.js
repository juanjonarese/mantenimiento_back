// Prueba de integración con Cloudflare R2: subir, leer público y borrar.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { subirAR2, borrarDeR2PorUrl, r2Configurado } = require('../config/r2');

(async () => {
  console.log('STORAGE_DRIVER =', process.env.STORAGE_DRIVER);
  console.log('R2 configurado  =', r2Configurado());
  if (!r2Configurado()) {
    console.error('❌ Faltan variables de R2 en el .env');
    process.exit(1);
  }

  const key = `pintura-vial/_test/test-${Date.now()}.txt`;
  const contenido = Buffer.from('Prueba R2 pintura-vial ' + new Date().toISOString());

  try {
    // 1) Subir
    const url = await subirAR2(contenido, key, 'text/plain');
    console.log('\n✅ 1/3 Subida OK');
    console.log('   URL pública:', url);

    // 2) Verificar acceso público
    const resp = await fetch(url);
    console.log(`\n${resp.ok ? '✅' : '❌'} 2/3 Acceso público: HTTP ${resp.status}`);
    if (resp.ok) {
      const texto = await resp.text();
      console.log('   Contenido leído:', JSON.stringify(texto));
    } else {
      console.log('   (Si es 401/403, falta habilitar el acceso público del bucket)');
    }

    // 3) Borrar
    const borrado = await borrarDeR2PorUrl(url);
    console.log(`\n${borrado ? '✅' : '❌'} 3/3 Borrado: ${borrado}`);

    // 4) Confirmar que ya no existe
    const resp2 = await fetch(url);
    console.log(`   Tras borrar, HTTP ${resp2.status} (esperado 404)`);

    console.log('\n🎉 Prueba completa.');
  } catch (e) {
    console.error('\n❌ Error en la prueba:', e.name, '-', e.message);
    process.exit(1);
  }
})();
