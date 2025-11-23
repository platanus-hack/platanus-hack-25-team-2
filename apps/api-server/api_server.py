import base64
import io
import tempfile
import os
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from PIL import Image

# DeepFace para embeddings de 512 dimensiones (Facenet512)
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("⚠️  ERROR: DeepFace no está instalado. Es requerido para este servidor.")
    print("   Instalar: pip install deepface")

# Configuración de Supabase
SUPABASE_URL = "https://zgvntpcrofqtmuktrqjs.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpndm50cGNyb2ZxdG11a3RycWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODAwODgsImV4cCI6MjA3OTM1NjA4OH0.EqWHH-K3358RN5YDpAgB1oprDzf6yZzzhoTg2e6YodA"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Face Recognition API", description="API para matching facial con Supabase")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ImageRequest(BaseModel):
    image_base64: str
    threshold: float = 1.0  # Umbral por defecto para embeddings de 512 dimensiones (Facenet512)


class MatchResponse(BaseModel):
    match_found: bool
    person_name: str | None = None
    distance: float | None = None
    threshold: float
    linkedin_content: str | None = None
    message: str


def decode_base64_image(base64_string: str) -> Image.Image:
    """Decodifica una imagen desde base64"""
    try:
        # Remover el prefijo data:image si existe
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decodificar base64
        image_data = base64.b64decode(base64_string)
        
        # Convertir a PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convertir a RGB si es necesario (para PNG con transparencia)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return image
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al decodificar imagen base64: {str(e)}")


def calculate_face_encoding(image: Image.Image) -> np.ndarray:
    """
    Calcula el encoding facial de una imagen usando DeepFace Facenet512 (512 dimensiones).
    Esto asegura consistencia con los embeddings guardados en la DB.
    """
    if not DEEPFACE_AVAILABLE:
        raise HTTPException(
            status_code=500,
            detail="DeepFace no está instalado. Es requerido para calcular embeddings de 512 dimensiones."
        )
    
    try:
        # Guardar imagen temporalmente para DeepFace
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, f"temp_face_{os.getpid()}.jpg")
        
        # Guardar imagen como JPEG
        image.save(temp_path, "JPEG")
        
        try:
            # Calcular embedding con DeepFace Facenet512 (512 dimensiones)
            result = DeepFace.represent(
                img_path=temp_path,
                model_name="Facenet512",  # Modelo de 512 dimensiones
                enforce_detection=False,  # No fallar si no detecta cara claramente
                detector_backend='opencv'  # Backend de detección
            )
            
            if not result or len(result) == 0:
                raise ValueError("No se detectó ninguna cara en la imagen")
            
            # Tomar el primer embedding (primera cara detectada)
            embedding = result[0]['embedding']
            
            return np.array(embedding)
        finally:
            # Limpiar archivo temporal
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar la imagen con DeepFace: {str(e)}")


@app.get("/")
def root():
    """Endpoint raíz"""
    return {
        "message": "Face Recognition API",
        "model": "DeepFace Facenet512 (512 dimensiones)",
        "endpoints": {
            "/match": "POST - Recibe imagen como archivo y retorna match usando DeepFace",
            "/health": "GET - Estado del servidor"
        }
    }


@app.get("/health")
def health():
    """Endpoint de salud"""
    try:
        # Verificar conexión con Supabase
        response = supabase.table("known_people").select("id").limit(1).execute()
        return {
            "status": "healthy",
            "supabase_connected": True,
            "database_records": len(response.data) if response.data else 0
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "supabase_connected": False,
            "error": str(e)
        }


@app.post("/match", response_model=MatchResponse)
async def match_face(file: UploadFile = File(...), threshold: float = Form(1.0)):
    """
    Recibe una imagen como archivo y busca el mejor match en Supabase.
    Usa DeepFace Facenet512 (512 dimensiones) para calcular embeddings.
    
    Args:
        file: Archivo de imagen
        threshold: Umbral de coincidencia (default 1.0 para embeddings de 512 dims)
                   Valores típicos: 0.6-1.2 para Facenet512
    
    Returns:
        MatchResponse con información del match encontrado
    """
    try:
        # 1. Leer imagen del archivo
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convertir a RGB si es necesario
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # 2. Calcular encoding facial
        target_encoding = calculate_face_encoding(image)
        
        # 3. Obtener encodings de Supabase (usar face_encoding que tiene 512 dimensiones)
        try:
            response = supabase.table("known_people").select(
                "full_name, face_encoding, face_encoding_deepface_512, linkedin_content, discord_username"
            ).execute()
            people_db = response.data
            
            if not people_db:
                return MatchResponse(
                    match_found=False,
                    threshold=threshold,
                    message="La base de datos está vacía"
                )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al conectar con Supabase: {str(e)}"
            )
        
        # 4. Comparar con todos los registros
        best_match = None
        best_dist = float("inf")
        match_details = None
        
        for person in people_db:
            try:
                # Priorizar face_encoding_deepface_512 si existe, sino usar face_encoding
                # Ambos deberían tener 512 dimensiones (DeepFace Facenet512)
                db_encoding_array = person.get('face_encoding_deepface_512') or person.get('face_encoding')
                
                if not db_encoding_array:
                    continue  # Saltar si no tiene embedding
                
                # Convertir lista JSON a numpy array
                db_encoding = np.array(db_encoding_array)
                
                # Validar que las dimensiones coincidan
                if len(db_encoding) != len(target_encoding):
                    print(f"⚠️  Advertencia: Dimensiones no coinciden. DB: {len(db_encoding)}, Target: {len(target_encoding)}")
                    continue
                
                # Calcular distancia Euclidiana
                dist = np.linalg.norm(target_encoding - db_encoding)
                
                if dist < best_dist:
                    best_dist = dist
                    best_match = person['full_name']
                    match_details = person
            except Exception as e:
                # Continuar con el siguiente registro si hay error
                print(f"⚠️  Error procesando registro: {e}")
                continue
        
        # 5. Determinar si hay match
        match_found = best_dist < threshold
        
        if match_found:
            return MatchResponse(
                match_found=True,
                person_name=best_match,
                distance=float(best_dist),
                threshold=threshold,
                linkedin_content=match_details.get('linkedin_content'),
                message=f"Match encontrado: {best_match}"
            )
        else:
            return MatchResponse(
                match_found=False,
                person_name=best_match if best_match else None,
                distance=float(best_dist) if best_match else None,
                threshold=threshold,
                message=f"No se encontró match. El más cercano fue {best_match} con distancia {best_dist:.4f}" if best_match else "No se encontraron coincidencias"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@app.post("/calculate-embedding")
async def calculate_embedding_only(file: UploadFile = File(...)):
    """
    Calcula solo el embedding facial de una imagen (512 dimensiones) sin hacer match.
    Útil para endpoints de Next.js que quieren hacer el matching ellos mismos.
    
    Args:
        file: Archivo de imagen
    
    Returns:
        JSON con el embedding calculado (array de 512 números)
    """
    try:
        # 1. Leer imagen del archivo
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convertir a RGB si es necesario
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # 2. Calcular encoding facial
        target_encoding = calculate_face_encoding(image)
        
        return {
            "embedding": target_encoding.tolist(),
            "dimensions": len(target_encoding),
            "model": "Facenet512"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular embedding: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

