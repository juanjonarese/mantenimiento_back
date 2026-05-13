# Backend - Sistema de Gestión de Usuarios

Backend desarrollado con Node.js, Express y MongoDB para gestión básica de usuarios.

## Características

- Autenticación con JWT
- CRUD completo de Usuarios
- Protección de rutas mediante middleware
- Encriptación de contraseñas con Argon2

## Estructura del Proyecto

```
backend/
├── controllers/       # Lógica de controladores
├── db/               # Configuración de base de datos
├── middelware/       # Middleware de autenticación
├── models/           # Modelos de Mongoose
├── routes/           # Definición de rutas
├── services/         # Lógica de negocio
├── server.js         # Punto de entrada de la aplicación
└── package.json      # Dependencias
```

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar las variables de entorno en `.env`:
```env
PORT=3001
MONGO_CONNECT=mongodb://localhost:27017/usuarios_db
JWT_SECRET=tu_clave_secreta_super_segura
NODE_ENV=development
```

## Ejecutar

### Modo desarrollo (con nodemon):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

El servidor se iniciará en `http://localhost:3001`

## Base de Datos MongoDB

### Opción 1: MongoDB Local
1. Instalar MongoDB Community Edition
2. Iniciar el servicio de MongoDB
3. Usar la conexión: `mongodb://localhost:27017/usuarios_db`

### Opción 2: MongoDB Atlas (Cloud)
1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear un cluster gratuito
3. Obtener la cadena de conexión
4. Actualizar `MONGO_CONNECT` en el archivo `.env`

## Endpoints Principales

### Autenticación
- `POST /api/usuarios/login` - Iniciar sesión
- `POST /api/usuarios/registro` - Registrar nuevo usuario

### Usuarios (requieren autenticación)
- `GET /api/usuarios` - Obtener todos los usuarios
- `GET /api/usuarios/:id` - Obtener usuario por ID
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

## Crear Primer Usuario

Una vez que el servidor esté corriendo y la base de datos conectada, crear el primer usuario:

```bash
curl -X POST http://localhost:3001/api/usuarios/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Admin",
    "apellido": "Sistema",
    "email": "admin@ejemplo.com",
    "password": "Admin123"
  }'
```

## Seguridad

- Las contraseñas se encriptan con Argon2
- Los tokens JWT expiran en 1 hora
- Todas las rutas protegidas requieren token válido en el header `Authorization: Bearer <token>`
- Validación de contraseñas: Deben comenzar con mayúscula, contener letras y números, mínimo 6 caracteres

## Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación basada en tokens
- **Argon2** - Hash de contraseñas
- **CORS** - Manejo de peticiones cross-origin
