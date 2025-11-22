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

## Variables de Entorno

- `SUPABASE_URL` - URL de tu proyecto Supabase
- `SUPABASE_KEY` - Clave anónima de Supabase
