# API Server

Servidor FastAPI para reconocimiento facial con integración con Supabase.

**Modelo de reconocimiento facial:** DeepFace Facenet512 (512 dimensiones)

El servidor usa DeepFace Facenet512 para calcular embeddings de 512 dimensiones, asegurando consistencia con los datos guardados en la base de datos.

## Instalación

```bash
pip install -r requirements.txt
```

## Uso

### Desarrollo

```bash
npm run dev
# o directamente
python api_server.py
```

### Producción

```bash
uvicorn api_server:app --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /` - Información de la API (incluye modelo usado: DeepFace Facenet512)
- `GET /health` - Estado del servidor y conexión con Supabase
- `POST /match` - Busca coincidencias faciales en la base de datos usando DeepFace (512 dimensiones)
  - **Parámetros:**
    - `file`: Archivo de imagen (multipart/form-data)
    - `threshold`: Umbral de coincidencia (default: 1.0 para Facenet512)
  - **Nota:** La imagen enviada se procesa con DeepFace Facenet512 para calcular un embedding de 512 dimensiones, que se compara con los embeddings guardados en la columna `face_encoding` o `face_encoding_deepface_512` de la base de datos.

## Scripts de Utilidad

### `upload_linkedin_data.py`

Script para subir perfiles de LinkedIn con embeddings faciales precalculados a Supabase.

**Uso:**

```bash
# Configurar la clave de servicio de Supabase
export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'

# Ejecutar el script (usa el archivo por defecto: linkedin_profiles_with_embeddings.json)
python upload_linkedin_data.py

# O especificar un archivo JSON diferente
python upload_linkedin_data.py mi_archivo.json
```

**Formato del JSON esperado:**
El archivo JSON debe ser un array de objetos con la siguiente estructura:

```json
[
  {
    "username": "usuario123",
    "linkedin_url": "https://linkedin.com/in/usuario",
    "scraped_at": "2025-11-22 11:28:50",
    "name": "Nombre Completo",
    "headline": "Título profesional",
    "location": "Ubicación",
    "profile_image_url": "https://...",
    "about": "Descripción del perfil",
    "experience": [{"title": "Título", "company": "Empresa"}],
    "education": [{"school": "Escuela", "degree": "Grado"}],
    "skills": ["skill1", "skill2"],
    "face_embedding": [0.123, -0.456, ...],  // Array de 512 números flotantes
    "embedding_metadata": {
      "status": "success",
      "model": "Facenet512",
      "detector": "retinaface",
      "embedding_size": 512,
      "processed_at": "2025-11-22T17:26:59.180661"
    },
    "error": null
  }
]
```

**Funcionalidades:**

- Descarga imágenes de perfil desde URLs
- Sube imágenes a Supabase Storage
- Formatea el contenido de LinkedIn en texto estructurado
- Inserta registros en la tabla `known_people` con los embeddings precalculados
- Maneja errores y omite perfiles inválidos

### `upload_linkedin_data_ab_test.py`

Script para A/B Testing con dos métodos de embedding:

1. **Método Externo (512 dims)**: USA el embedding del JSON (Facenet512)
2. **Método Local (128 dims)**: Descarga la imagen y calcula embedding con face-recognition (face-api)

Ambos embeddings se guardan en la DB para comparar precision y velocidad.

**Uso:**

```bash
# Configurar la clave de servicio de Supabase
export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'

# Ejecutar el script (usa el archivo por defecto: linkedin_profiles_with_embeddings.json)
python upload_linkedin_data_ab_test.py

# O especificar un archivo JSON diferente
python upload_linkedin_data_ab_test.py mi_archivo.json
```

**Columnas nuevas en DB:**

- `face_encoding`: embedding del JSON (512 dimensiones, Facenet512)
- `face_encoding_faceapi`: embedding calculado (128 dimensiones, face-recognition)
- `embedding_method`: "hybrid" (ambos métodos)

**Funcionalidades:**

- Descarga imágenes desde URLs
- Calcula embedding con face-recognition (128 dimensiones)
- Guarda ambos embeddings (JSON y calculado)
- Permite comparar presición y velocidad de ambos métodos

### `add_faceapi_embeddings.py`

Script para agregar embeddings faciales locales (face-api, 128 dimensiones) a perfiles existentes sin re-subir toda la información.

**Uso:**

```bash
# Configurar la clave de servicio de Supabase
export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'

# Ejecutar el script
python add_faceapi_embeddings.py
```

**Funcionalidades:**

- Lee perfiles existentes de la DB
- Descarga la imagen desde `photo_path`
- Calcula embedding con face-api (128 dimensiones)
- Actualiza solo la columna `face_encoding_faceapi`
- Omite perfiles que ya tienen embedding
- Maneja errores sin afectar otros perfiles

### `upload_photos_to_storage.py`

Script para descargar fotos de perfil desde URLs y subirlas a Supabase Storage.

**Uso:**

```bash
# Configurar la clave de servicio de Supabase
export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'

# Ejecutar el script
python upload_photos_to_storage.py
```

**Funcionalidades:**

- Lee URLs de fotos del JSON
- Descarga imágenes desde las URLs
- Sube a Supabase Storage (bucket: `photos`)
- Actualiza el JSON con URLs públicas de Storage
- Evita re-subir fotos que ya existen
- Genera URLs públicas para acceso desde el frontend

### `update_photo_paths.py`

Script para actualizar `photo_path` en la DB con las URLs de Storage.

**Uso:**

```bash
export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'
python update_photo_paths.py
```

**Funcionalidades:**

- Lee perfiles del JSON actualizado
- Busca cada perfil en la DB por nombre
- Actualiza `photo_path` con URL pública de Storage
- Reporta éxito/fallos

### `add_faceapi_embeddings_from_storage.py`

Script para calcular embeddings faciales (128 dimensiones) desde fotos en Storage.

**Uso:**

```bash
export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'
python add_faceapi_embeddings_from_storage.py
```

**Funcionalidades:**

- Obtiene todos los perfiles de la DB
- Descarga fotos desde `photo_path` (Storage)
- Calcula embedding con face_recognition (128 dims)
- Actualiza `face_encoding_faceapi` en la DB
- Omite perfiles que ya tienen embedding
- Maneja errores sin afectar otros perfiles

### `upload_linkedin_mentors.py`

Script para procesar perfiles de LinkedIn **sin embeddings precalculados** y calcular ambos embeddings (Face-API y DeepFace) automáticamente.

**Uso:**

```bash
# Instalar DeepFace si aún no está instalado
pip install deepface

# Configurar la clave de servicio de Supabase
export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'

# Ejecutar el script (usa el archivo por defecto: linkedin_mentors_output.json)
python upload_linkedin_mentors.py

# O especificar un archivo JSON diferente
python upload_linkedin_mentors.py mi_archivo.json
```

**Formato del JSON esperado:**

El archivo JSON debe ser un array de objetos con la siguiente estructura (similar a `linkedin_mentors_output.json`):

```json
[
  {
    "username": "profile_1",
    "linkedin_url": "https://www.linkedin.com/in/usuario",
    "scraped_at": "2025-11-22 18:42:03",
    "name": "Nombre Completo",
    "headline": "Título profesional",
    "location": "Ubicación",
    "profile_image_url": "https://media.licdn.com/...",
    "about": null,
    "experience": [{ "title": "Título", "company": "Empresa" }],
    "education": [{ "school": "Escuela", "degree": "Grado" }],
    "skills": [],
    "error": null
  }
]
```

**Nota:** Este script NO requiere que el JSON tenga el campo `face_embedding`. Los embeddings se calculan automáticamente.

**Funcionalidades:**

- Descarga imágenes de perfil desde URLs de LinkedIn
- Calcula embedding con **Face-API** (face-recognition, 128 dimensiones)
- Calcula embedding con **DeepFace** (Facenet512, 512 dimensiones)
- Guarda ambos embeddings en la DB:
  - `face_encoding_faceapi`: 128 dimensiones
  - `face_encoding` / `face_encoding_deepface_512`: 512 dimensiones
- Si DeepFace no está instalado, solo calcula Face-API
- Maneja errores y omite perfiles inválidos

**Columnas en DB:**

- `face_encoding`: embedding principal (DeepFace 512 dims si disponible, sino Face-API 128 dims)
- `face_encoding_faceapi`: embedding de Face-API (128 dimensiones)
- `face_encoding_deepface_512`: embedding de DeepFace (512 dimensiones)

### `add_deepface_embeddings.py`

Script para calcular embeddings faciales con **más dimensiones** usando DeepFace en perfiles existentes.

**⚠️ Limitación de face-api.js y face_recognition:**

- `face-api.js` (frontend) y `face_recognition` (Python) están limitados a **128 dimensiones**
- No es posible aumentar las dimensiones directamente con estos modelos

**Solución: Usar DeepFace con modelos más grandes**

**Uso:**

```bash
# Instalar DeepFace (primera vez descargará los modelos automáticamente)
pip install deepface

export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'
python add_deepface_embeddings.py
```

**Modelos disponibles en DeepFace:**

| Modelo     | Dimensiones | Precisión  | Velocidad  |
| ---------- | ----------- | ---------- | ---------- |
| Facenet512 | 512         | ⭐⭐⭐⭐⭐ | Media      |
| ArcFace    | 512         | ⭐⭐⭐⭐⭐ | Media      |
| DeepID     | 160         | ⭐⭐⭐⭐   | Rápida     |
| Dlib       | 128         | ⭐⭐⭐     | Muy rápida |
| OpenFace   | 128         | ⭐⭐       | Muy rápida |
| VGG-Face   | 2622        | ⭐⭐⭐⭐   | Lenta      |

**Configuración:**

Editar `add_deepface_embeddings.py` para cambiar el modelo:

```python
MODEL_NAME = "Facenet512"  # Cambiar aquí: Facenet512, ArcFace, DeepID, etc.
EMBEDDING_COLUMN = "face_encoding_deepface_512"  # Nombre de columna en DB
```

**Funcionalidades:**

- Calcula embeddings con modelos de más dimensiones (256, 512, etc.)
- Soporta múltiples modelos (Facenet512, ArcFace, DeepID, etc.)
- Guarda en nueva columna de la DB
- Primera ejecución descarga los modelos automáticamente

## Cambiar entre Métodos para A/B Testing

### Opción 1: Variable de Entorno (Recomendado)

```bash
# Usar método externo (Facenet512, 512 dims) - MÁS PRECISO
NEXT_PUBLIC_FACE_METHOD=external npm run dev

# Usar método local (face-api, 128 dims) - MÁS RÁPIDO
NEXT_PUBLIC_FACE_METHOD=faceapi_local npm run dev

# A/B Testing (probar ambos)
NEXT_PUBLIC_FACE_METHOD=both npm run dev
```

### Opción 2: Archivo de Configuración

Editar `apps/web/lib/config.ts`:

```typescript
export const FACE_RECOGNITION_METHOD = "external"; // Cambiar aquí
```

### Endpoints Disponibles

| Endpoint           | Método   | Dims  | Velocidad | Precisión |
| ------------------ | -------- | ----- | --------- | --------- |
| `/api/match`       | Externo  | 512   | Lento     | ⭐⭐⭐    |
| `/api/match-local` | Local    | 128   | Rápido    | ⭐⭐      |
| `/api/match-ab`    | A/B Test | Ambos | Ambos     | Ambos     |

## Variables de Entorno

- `SUPABASE_URL` - URL de tu proyecto Supabase (configurado en el código)
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio de Supabase (requerida para scripts de carga de datos)
