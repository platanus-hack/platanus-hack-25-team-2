# Face Demo Monorepo

Monorepo usando Turborepo que contiene:

- **API Server** (Python/FastAPI): Servidor de reconocimiento facial
- **API Server TS** (TypeScript/Express): Servidor alternativo en Node.js
- **Web App** (Next.js): Aplicación web con reconocimiento facial
- **Mobile App** (Expo/React Native): Aplicación móvil

## Estructura del Proyecto

```
face-demo/
├── apps/
│   ├── api-server/     # Servidor FastAPI (Python)
│   ├── api-server-ts/  # Servidor Express (TypeScript/Node.js)
│   ├── web/            # App Web Next.js
│   └── mobile/         # App Expo/React Native
├── packages/           # Paquetes compartidos (futuro)
├── package.json        # Configuración raíz del monorepo
└── turbo.json         # Configuración de Turborepo
```

## Requisitos Previos

- Node.js >= 18.0.0
- Python 3.8+
- npm o yarn
- Para la app móvil: Expo CLI (se instala automáticamente)

## Instalación

### 1. Instalar dependencias del monorepo

```bash
npm install
```

### 2. Instalar dependencias de Python

```bash
cd apps/api-server
pip install -r requirements.txt
```

## Desarrollo

### Ejecutar todas las apps en modo desarrollo

```bash
npm run dev
```

### Ejecutar apps individualmente

**API Server (Python/FastAPI):**

```bash
cd apps/api-server
npm run dev
# o directamente
python api_server.py
```

**API Server (TypeScript/Express):**

```bash
cd apps/api-server-ts
npm install
npm run download-models  # Primera vez solamente
npm run dev
```

**Web App (Next.js):**

```bash
cd apps/web
npm run dev
```

**Mobile App:**

```bash
cd apps/mobile
npm run dev
# o
npm start
```

## Scripts Disponibles

- `npm run dev` - Ejecuta todas las apps en modo desarrollo
- `npm run build` - Construye todas las apps
- `npm run start` - Inicia todas las apps en modo producción
- `npm run lint` - Ejecuta linters en todas las apps
- `npm run clean` - Limpia node_modules y archivos generados

## Apps

### Web App (`apps/web`)

Aplicación web construida con Next.js que incluye:

**Características:**

- Captura de fotos desde la webcam
- Detección facial en tiempo real usando face-api.js
- Reconocimiento facial integrado con Supabase
- API Routes para procesamiento en el servidor
- UI moderna y responsiva

**Endpoints de API:**

- `POST /api/match` - Busca coincidencias faciales

**Puerto:** 3000

### API Server (`apps/api-server`)

Servidor FastAPI para reconocimiento facial con integración con Supabase (alternativa en Python).

**Endpoints:**

- `GET /` - Información de la API
- `GET /health` - Estado del servidor
- `POST /match` - Busca coincidencias faciales

**Puerto:** 8000

Ver más detalles en [apps/api-server/README.md](apps/api-server/README.md)

### Mobile App (`apps/mobile`)

Aplicación móvil construida con Expo y React Native con detección facial en tiempo real.

**Características:**

- Detección de rostros en tiempo real usando la cámara frontal
- Visualización de recuadro alrededor de la cara detectada
- Interfaz moderna y minimalista

**Plataformas soportadas:**

- iOS
- Android
- Web

Ver más detalles en [apps/mobile/README.md](apps/mobile/README.md)

## Tecnologías

- **Monorepo:** Turborepo
- **Web:** Next.js, React, TypeScript, face-api.js
- **API:** FastAPI (Python) - Servidor alternativo
- **Mobile:** Expo, React Native, TypeScript
- **Base de datos:** Supabase
- **Reconocimiento Facial:** face-api.js (cliente), face_recognition (Python)

## Contribuir

1. Crear una rama desde `main`
2. Hacer cambios en la app correspondiente
3. Probar localmente con `npm run dev`
4. Crear un Pull Request
