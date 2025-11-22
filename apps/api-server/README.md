# API Server

Servidor FastAPI para reconocimiento facial con integración con Supabase.

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

- `GET /` - Información de la API
- `GET /health` - Estado del servidor y conexión con Supabase
- `POST /match` - Busca coincidencias faciales en la base de datos

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

### `seed_supabase.py`

Script para procesar perfiles de LinkedIn calculando embeddings faciales desde imágenes.

**Uso:**

```bash
export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'
python seed_supabase.py
```

Este script requiere que el archivo `linkedin_profiles_data.json` exista y calcula los embeddings usando `face_recognition`.

## Variables de Entorno

- `SUPABASE_URL` - URL de tu proyecto Supabase (configurado en el código)
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio de Supabase (requerida para scripts de carga de datos)
