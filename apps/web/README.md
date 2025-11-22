# Face Recognition Web App

Aplicación web construida con Next.js que permite capturar fotos desde la webcam y realizar reconocimiento facial contra una base de datos en Supabase.

## 🚀 Características

- **Verificación automática cada 5 segundos** - No requiere interacción manual
- **Detección facial en tiempo real** usando face-api.js
- **Reconocimiento facial continuo** comparando con base de datos en Supabase
- **Panel de información en vivo** - Muestra resultados en tiempo real
- **Exposición de cámara optimizada** para mejor captura
- **API Routes integradas** para procesamiento en el servidor
- **UI moderna y responsiva** con Tailwind CSS (desktop y móvil)
- **Sin necesidad de backend separado** - todo integrado en Next.js

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase con la tabla `known_people` configurada

## 🛠️ Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Los modelos de face-api.js ya están incluidos en `public/models/`

3. Configurar variables de entorno (opcional):

Crea un archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=tu-anon-key
```

## 🏃 Uso

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Producción

```bash
npm run build
npm start
```

## 📡 API Routes

### POST `/api/match`

Busca coincidencias faciales en la base de datos.

**Request:**

```json
{
  "face_descriptor": [0.123, 0.456, ...], // Array de 128 números
  "threshold": 0.6
}
```

**Response:**

```json
{
  "match_found": true,
  "person_name": "John Doe",
  "distance": 0.42,
  "threshold": 0.6,
  "linkedin_content": "...",
  "discord_username": "@johndoe",
  "message": "Match encontrado: John Doe"
}
```

## 🎯 Cómo Funciona

1. **Detección Continua**: La cámara detecta rostros en tiempo real cada segundo
2. **Verificación Automática**: Cada 5 segundos, si hay un rostro detectado, se realiza una verificación automática
3. **Procesamiento Cliente**: face-api.js procesa la imagen en el navegador y extrae un descriptor facial (128 dimensiones)
4. **Envío al Servidor**: El descriptor se envía a la API Route `/api/match`
5. **Comparación**: El servidor compara el descriptor con todos los rostros en Supabase usando distancia euclidiana
6. **Resultado en Tiempo Real**: Se muestra el resultado en el panel lateral con información completa de la persona
7. **Ciclo Continuo**: El proceso se repite automáticamente cada 5 segundos mientras haya un rostro detectado

## 🔧 Configuración

### Threshold (Umbral)

El threshold determina qué tan estricto es el matching:

- **0.4 - 0.5**: Muy estricto (menos falsos positivos)
- **0.6**: Balanceado (recomendado)
- **0.7 - 0.8**: Más permisivo

### Estructura de la Base de Datos (Supabase)

Tabla `known_people`:

```sql
CREATE TABLE known_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  face_encoding FLOAT8[] NOT NULL,
  linkedin_content TEXT,
  discord_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📁 Estructura del Proyecto

```
apps/web/
├── app/
│   ├── api/
│   │   └── match/
│   │       └── route.ts          # API Route para matching
│   ├── layout.tsx
│   ├── page.tsx                  # Página principal
│   └── globals.css
├── components/
│   └── FaceRecognition.tsx       # Componente de captura y reconocimiento
├── lib/
│   ├── supabase.ts               # Cliente de Supabase
│   └── utils.ts
├── public/
│   └── models/                   # Modelos de face-api.js
│       ├── ssd_mobilenetv1_*
│       ├── face_landmark_68_*
│       └── face_recognition_*
└── package.json
```

## 🐛 Troubleshooting

### Error: "No se detectó ninguna cara"

- Asegúrate de que la iluminación sea buena
- Mira directamente a la cámara
- Verifica que los modelos estén cargados correctamente

### Error: "La base de datos está vacía"

- Verifica que la tabla `known_people` tenga registros
- Comprueba las credenciales de Supabase

### Los modelos no se cargan

- Verifica que los archivos estén en `public/models/`
- Revisa la consola del navegador para errores de red

## 🤝 Integración con Supabase

Este proyecto usa Supabase para almacenar y consultar rostros conocidos. Los descriptores faciales se almacenan como arrays de 128 números (Float8[]) en PostgreSQL.

Para agregar nuevas personas a la base de datos, usa el script de seed en `apps/api-server/seed_supabase.py`.

## 📝 Tecnologías Utilizadas

- **Next.js 16** - Framework React con App Router
- **TypeScript** - Type safety
- **face-api.js** - Reconocimiento facial en el navegador
- **Supabase** - Base de datos y backend
- **Tailwind CSS** - Estilos
- **react-webcam** - Acceso a la cámara
- **lucide-react** - Iconos

## 📄 Licencia

ISC
