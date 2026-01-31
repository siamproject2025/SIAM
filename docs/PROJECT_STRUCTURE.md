# Documentación del proyecto SIAM 📚

> Archivo: `docs/PROJECT_STRUCTURE.md`

## Resumen rápido
**SIAM** es una aplicación web para gestión escolar con dos partes principales:
- **backend/**: API en Node.js (Express) + MongoDB (Mongoose) + Firebase Admin (autenticación) + GridFS/Google Drive para archivos.
- **frontend/**: aplicación en React (Create React App) que consume la API.

---

## Estructura de carpetas (alto nivel) 🔧

- `backend/`
  - `Dockerfile`, `docker-compose.yml`, `package.json` — configuración y scripts del backend.
  - `src/`
    - `index.js` — punto de entrada del servidor; configura CORS, rutas, sirve build del frontend.
    - `config/` — `DB.js` (conexión Mongo), `firebaseAdmin.js` (inicializa Firebase), `gridfs.js` (subida/descarga con Sharp/ GridFS).
    - `Controllers/` — lógica de negocio por recurso (ej.: `bienesController.js`, `bibliotecaController.js`, `directivaController.js`, `usuario_controller.js`, etc.).
    - `Models/` — esquemas de Mongoose (`Usuario`, `Alumno`, `Bien`, `Horario`, `Grado`, `Question`, etc.).
    - `Routes/` — definiciones de rutas REST por recurso (`bienesRoutes.js`, `alumnosRoutes.js`, `Horarios.js`, `ordenCompra.js`, etc.).
    - `middleware/` — autenticación (`authMiddleWare.js`, `authenticateToken.js`), autorización (`checkRole.js`), subida de archivos (`uploadImage.js`), util (`getRefreshToken.js`).
    - `public/` — archivos estáticos del backend (si aplica).
  - `archivos_biblioteca/` (mapeado en docker-compose) — carpeta para archivos subidos a Google Drive / biblioteca.

- `frontend/`
  - `Dockerfile`, `docker-compose.yml`, `package.json` — configuración y scripts del frontend.
  - `public/` — assets públicos y `index.html`.
  - `src/`
    - `App.js`, `index.js` — punto de entrada de React.
    - `components/` — componentes reutilizables (Navbar, Sidebar, tablas, formularios, etc.).
    - `screens/` — vistas / páginas para las distintas secciones de la app.
    - `api/` — llamadas a la API (ej. `loadingController.js`).
    - `styles/`, `assets/` — estilos y recursos estáticos.
  - `build/` — resultado del `npm run build` para producción (servido por backend en producción).

- `docs/` — (este archivo) documentación del proyecto.

---

## Archivos clave y su propósito 🔎

- `backend/package.json` — dependencias (express, mongoose, firebase-admin, sharp, gridfs-stream, multer, pdf-lib, uuid, etc.) y scripts: `start`, `dev`.
- `frontend/package.json` — dependencias de UI (React, MUI, FullCalendar, bootstrap, axios, xlsx, etc.) y scripts: `build`, `start` (serve -s build), `test`.
- `backend/src/index.js` — monta las rutas, establece CORS y arranca el servidor.
- `backend/src/config/firebaseAdmin.js` — inicializa Firebase Admin con `GOOGLE_CREDENTIALS` (string JSON en env).
- `backend/src/middleware/uploadImage.js` — procesa imágenes con `sharp` y las sube a GridFS.
- `backend/src/Models/usuario_modelo.js` — esquema de usuarios y roles.
- `backend/src/Routes/*` — entradas REST por recursos (ej. `/api/bienes`, `/api/alumnos`, `/api/actividades`, `/api/biblioteca`, `/api/questions`, etc.).
- `frontend/src/components` y `frontend/src/screens` — UI y lógica cliente; usan `REACT_APP_API_URL` para comunicar con backend.

---

## Variables de entorno principales ⚙️

- Backend:
  - `MONGO_URI` — conexión a MongoDB
  - `PORT` — puerto del servidor (por defecto 5000)
  - `GOOGLE_CREDENTIALS` — JSON del service account para Firebase Admin (o archivo local `firebase-service-account.json`)
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID` — para integración con Google Drive
  - `RUTA_ARCHIVOS_BIBLIOTECA`, `NODE_ENV`

- Frontend:
  - `REACT_APP_API_URL` — URL base del backend

> Recomendación: agregar un `.env.example` en `backend/` y `frontend/` con las variables necesarias (sin valores reales) para facilitar la configuración.

---

## Cómo ejecutar localmente ▶️

- Backend (desarrollo):
  1. cd `backend`
  2. `npm install`
  3. configurar `.env` con `MONGO_URI`, credenciales Google/Firebase, etc.
  4. `npm run dev` (usa nodemon)

- Frontend (build + servir):
  1. cd `frontend`
  2. `npm install`
  3. `npm run build`
  4. `npm start` (esto sirve el build usando `serve -s build`)

- Docker (opcional):
  - Levantar `backend` + `mongo`: `docker-compose up --build` (desde `backend/` donde está el `docker-compose.yml`) o ajustar si usas un `docker-compose` raíz.

---

## Rutas API (resumen) 🛣️

Las rutas principales están prefijadas con `/api` (ver `backend/src/index.js`). Ejemplos:
- `/api/usuarios` — gestión de usuarios y autenticación
- `/api/bienes` — CRUD de bienes (incluye subida de imagen)
- `/api/horario` — gestión de horarios
- `/api/alumnos` — obtener alumnos
- `/api/actividades`, `/api/biblioteca`, `/api/donaciones`, `/api/proveedores`, `/api/grados`, `/api/matriculas`, `/api/compras`, `/api/questions` — rutas CRUD específicas por dominio

> Nota: Muchas rutas requieren autenticación con Firebase y chequeo de roles (`checkRole`).

---

## Recomendaciones y próximos pasos ✅
- Añadir `docs/API.md` o un Swagger/OpenAPI con la definición de endpoints y esquemas.
- Crear `.env.example` en `backend/` y `frontend/`.
- Añadir pruebas unitarias / integración y un flujo CI básico para `build` y `test`.

---

Si quieres, genero ahora una versión más detallada por módulo (por ejemplo `docs/API.md` con todos los endpoints y ejemplos) o un `README.md` en `backend/` y `frontend/` basado en esta información.