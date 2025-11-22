# Face Recognition Service

Flask-based microservice for identifying people from images using DeepFace and face embeddings stored in Supabase.

## Features

- Face detection and embedding generation using DeepFace with Facenet512
- Cosine similarity matching against database of known people
- Supports both base64 encoded images and multipart file uploads
- Returns best match with confidence score and profile information

## Setup

### 1. Install Dependencies

```bash
cd face-recognition-service
pip install -r requirements.txt
```

Note: First run will download DeepFace models (~200MB). This is normal and only happens once.

### 2. Environment Variables

The `.env` file is already configured with Supabase credentials:

```
SUPABASE_URL=https://zgvntpcrofqtmuktrqjs.supabase.co
SUPABASE_KEY=your_supabase_key
```

### 3. Database Schema

Ensure your Supabase `known_people` table has the following structure:

```sql
CREATE TABLE known_people (
  username TEXT PRIMARY KEY,
  name TEXT,
  headline TEXT,
  location TEXT,
  profile_image_url TEXT,
  linkedin_url TEXT,
  about TEXT,
  experience JSONB,
  education JSONB,
  skills JSONB,
  face_embedding FLOAT8[],
  scraped_at TIMESTAMP
);
```

## Running the Service

### Development Mode

```bash
python app.py
```

The service will start on `http://localhost:5000`

### Production Mode

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

### POST /api/identify

Identify a person from an uploaded image.

#### Request Format 1: JSON with Base64 Image

```bash
curl -X POST http://localhost:5000/api/identify \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

#### Request Format 2: Multipart Form Data

```bash
curl -X POST http://localhost:5000/api/identify \
  -F "image=@/path/to/image.jpg"
```

#### Response (Success)

```json
{
  "success": true,
  "match": {
    "username": "HechoEnChile",
    "name": "Agustín Arévalo",
    "headline": "Estudiante de Física UC | Fundador de empresa TI...",
    "location": "Chile",
    "profile_image_url": "https://...",
    "linkedin_url": "https://linkedin.com/in/...",
    "about": null,
    "experience": [...],
    "education": [...],
    "skills": [],
    "cosine_similarity": 0.85,
    "confidence": "High",
    "is_match": true
  }
}
```

#### Response (Error)

```json
{
  "success": false,
  "error": "No face detected in the image"
}
```

### GET /health

Health check endpoint.

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "healthy",
  "service": "face-recognition-service"
}
```

## Confidence Levels

- **High**: Cosine similarity > 0.8
- **Medium**: Cosine similarity > 0.7
- **Low**: Cosine similarity ≤ 0.7

The `is_match` field is `true` when similarity > 0.7 (Facenet512 standard threshold).

## Error Codes

- `400`: Bad request (no image, invalid format, no face detected)
- `404`: No matches found in database
- `500`: Internal server error

## Testing with Python

```python
import requests
import base64

# Test with base64
with open('test_image.jpg', 'rb') as f:
    image_b64 = base64.b64encode(f.read()).decode('utf-8')

response = requests.post(
    'http://localhost:5000/api/identify',
    json={'image': image_b64}
)
print(response.json())

# Test with file upload
with open('test_image.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:5000/api/identify',
        files={'image': f}
    )
print(response.json())
```

## Project Structure

```
face-recognition-service/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
├── .gitignore
├── services/
│   ├── face_service.py    # DeepFace embedding generation
│   └── db_service.py      # Supabase queries & matching
└── utils/
    └── image_utils.py     # Image preprocessing & format handling
```

## Notes

- First API call may be slower as DeepFace downloads model weights
- DeepFace uses RetinaFace detector for best accuracy
- Facenet512 generates 512-dimensional embeddings
- Temporary image files are automatically cleaned up after processing
