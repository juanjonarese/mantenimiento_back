# CLAUDE.md — Backend

Instrucciones para Claude Code trabajando en este repositorio.
**Estas instrucciones tienen prioridad sobre el comportamiento por defecto.**

## Qué es este proyecto

API del **Sistema de Gestión de Pintura Vial**: los operarios cargan trabajos de pintura
de calles desde el celular; la oficina gestiona clientes, materiales, turnos y
certificaciones. Node + Express + MongoDB (Mongoose), fotos en Cloudflare R2.

Frontend separado: repo `mantenimiento_front`.

## Comandos

```bash
npm run dev       # nodemon (recarga sola)
npm start         # producción
```

`.env` se copia de `.env.example`. Variables clave: `PORT` (3001), `MONGO_CONNECT`,
`JWT_SECRET`, `FRONT_URL`, `NODE_ENV` y las credenciales de R2
(`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, bucket y endpoint).

## 🚨 Reglas de Git — OBLIGATORIAS, sin excepción

**Contexto (septiembre 2026):** el historial de `main` fue reescrito con force-push para
sacar un archivo que tenía credenciales de producción. Por eso estas reglas son estrictas.

### ❌ Comandos PROHIBIDOS

Nunca ejecutar, nunca proponer, nunca "sugerir como última opción":

| Prohibido | Por qué |
|---|---|
| `git push --force` / `-f` / `--force-with-lease` | Puede reintroducir las credenciales purgadas o borrar el trabajo del otro |
| `git push --all` / `git push --tags` | Sube ramas viejas contaminadas |
| `git push <rama>` con rama distinta de `main` | Este proyecto trabaja solo sobre `main` |
| `git reset --hard` con cambios sin pushear | Se pierde trabajo sin vuelta atrás |
| `git rebase -i`, `filter-branch`, `filter-repo`, BFG | Reescriben historial |
| `git checkout -- .` / `git restore .` masivo | Borra cambios del otro que estén sin commitear |

Si alguno de estos **parece** ser la solución → **PARAR y avisarle a Juanjo.**
No es una decisión que se toma sola.

### ✅ La única rutina para subir cambios

Siempre igual, siempre en este orden:

```bash
git pull --rebase          # 1. traer lo del otro ANTES de tocar nada
                           # 2. ... trabajar ...
git status                 # 3. MIRAR qué se va a subir
git add -A
git commit -m "mensaje claro en español"
git pull --rebase          # 4. traer de nuevo por las dudas
git push                   # 5. subir
```

### 🔴 Si `git push` es rechazado

Un rechazo significa: *el remoto tiene algo que vos no tenés*. **Nunca es motivo para forzar.**

1. `git pull --rebase`
2. Si hay conflictos → resolverlos y `git rebase --continue`
3. `git push`
4. Si **sigue** fallando → **parar y avisarle a Juanjo.** Nada de `--force`.

### 🔐 Antes de cada commit

Revisar siempre qué se está por subir:

```bash
git status
git diff --cached --stat
```

**Nunca commitear:** `.env`, `.env.*`, `DOCUMENTACION-APP-CREA.md`, backups de la base,
claves, tokens, connection strings de Mongo, credenciales de R2, contraseñas.

Si aparece algo así en el staging → sacarlo (`git restore --staged <archivo>`), agregarlo
al `.gitignore` y avisar. Los secretos van **solo** en `.env` local, nunca en el código,
nunca en un `.md`, nunca en un comentario.

### 👥 Somos dos trabajando

Juanjo y Damián pushean desde máquinas distintas sobre el mismo `main`.

- **Commitear solo lo propio.** Si `git status` muestra archivos modificados que no tocaste,
  dejarlos y avisar — son del otro.
- Commits **chicos y frecuentes**, mejor que uno gigante al final.
- Mensajes en español, describiendo el cambio: `fix: ordenar la lista por fecha`,
  no `cambios` ni `update`.

### 🧹 Limpieza pendiente (hacer una sola vez, en cada máquina)

Si existe una rama `backup-old-main`, **contiene las credenciales viejas**. Borrarla:

```bash
git branch -D backup-old-main
git reflog expire --expire=now --all
git gc --prune=now
```

## Arquitectura — patrón MVC

El flujo es siempre el mismo, **respetarlo**:

```
routes/  →  controllers/  →  services/  →  models/
 (URL)      (req/res)       (lógica)      (Mongoose)
```

- **`server.js`** — entrada para desarrollo/servidor propio: CORS, rate limiting, monta rutas
- **`api/index.js`** — entrada para **Vercel** (serverless). Duplica la configuración de
  CORS de `server.js`. ⚠️ **Todo cambio de CORS, rate limit o montaje de rutas hay que
  hacerlo en LOS DOS archivos**, o funciona en local y falla en producción.
- **`routes/`** — define URLs y aplica middlewares (`verificarToken`, `esAdmin`)
- **`controllers/`** — leen `req`, responden `res`. Sin lógica de negocio.
- **`services/`** — la lógica de negocio y las consultas a Mongo
- **`models/`** — esquemas Mongoose: `usuarios`, `trabajos`, `turnos`, `clientes`,
  `tiposTarea`, `materialCatalogo`, `stockEntrada`, `accesoLog`
- **`middelware/auth.middleware.js`** — verificación de JWT y guard de rol
  (`verificarToken`, `esAdmin`).
  ⚠️ La carpeta se llama **`middelware`** (con la falta de ortografía). **Es a propósito,
  no renombrarla** — está importada en todos lados.
- **`db/config.db.js`** — conexión a Mongo con reintentos, compatible con serverless
- **`config/r2.js`** — cliente de Cloudflare R2 para las fotos
- **`scripts/`** — utilidades sueltas (crear usuario, hacer admin, migraciones, backup).
  **Nunca hardcodear credenciales acá**: leerlas de `process.env`.

## Rutas montadas

Todas bajo `/api`:

| Prefijo | Archivo |
|---|---|
| `/api/usuarios` | `routes/usuarios.routes.js` |
| `/api/trabajos` | `routes/trabajos.routes.js` |
| `/api/turnos` | `routes/turnos.routes.js` |
| `/api/tipos-tarea` | `routes/tiposTarea.routes.js` |
| `/api/materiales` | `routes/materialCatalogo.routes.js` |
| `/api/clientes` | `routes/clientes.routes.js` |
| `/api/fotos` | `routes/fotos.routes.js` |
| `/api/accesos` | `routes/accesos.routes.js` |

`/api/usuarios/login` y `/api/usuarios/registro` están limitados a 10 intentos cada 15 min.

## Autenticación y roles

1. Login/registro → devuelve un JWT (**expira en 1 hora**)
2. El front lo manda como `Authorization: Bearer <token>`
3. `verificarToken` lo valida en las rutas protegidas
4. `esAdmin` además exige `rol === "admin"`

**Toda ruta nueva necesita `verificarToken` explícito.** Una ruta sin middleware es una
ruta pública — no dejarla así por descuido.

## Contraseñas

Se validan igual en front y back: empiezan con mayúscula, tienen letras y números,
mínimo 6 caracteres.

Regex: `/^[A-Z](?=.*[a-z])(?=.*\d)[A-Za-z\d]{5,}$/`

Se guardan con **Argon2**. Nunca en texto plano, nunca devueltas en una respuesta de la API.

## CORS y Vercel

El backend corre en Vercel. Cosas que ya nos rompieron antes:

- El handler de `OPTIONS` va **primero**, antes de cualquier otro middleware
- `FRONT_URL` sin barra al final
- `vercel.json` usa `builds` + `routes` — no tocarlo sin necesidad

## Sin tests

`npm test` no hace nada. La verificación es manual: levantar el server y probar los
endpoints con la app o con curl.
