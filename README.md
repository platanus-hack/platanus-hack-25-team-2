# Face Demo Monorepo

Monorepo usando Turborepo que contiene:

- **API Server** (Python/FastAPI): Servidor de reconocimiento facial
- **Mobile App** (Expo/React Native): Aplicación móvil

## Estructura del Proyecto

```
face-demo/
├── apps/
│   ├── api-server/     # Servidor FastAPI
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

**API Server:**

```bash
cd apps/api-server
npm run dev
# o directamente
python api_server.py
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

### API Server (`apps/api-server`)

Servidor FastAPI para reconocimiento facial con integración con Supabase.

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
- **API:** FastAPI (Python)
- **Mobile:** Expo, React Native, TypeScript
- **Base de datos:** Supabase

## Contribuir

1. Crear una rama desde `main`
2. Hacer cambios en la app correspondiente
3. Probar localmente con `npm run dev`
4. Crear un Pull Request
