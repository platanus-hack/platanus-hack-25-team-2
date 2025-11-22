import base64
import io
import face_recognition
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from PIL import Image

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
    threshold: float = 0.6  # Umbral por defecto


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
    """Calcula el encoding facial de una imagen"""
    try:
        # Convertir PIL Image a numpy array para face_recognition
        image_array = np.array(image)
        
        # Calcular encodings
        encodings = face_recognition.face_encodings(image_array)
        
        if not encodings:
            raise ValueError("No se detectó ninguna cara en la imagen")
        
        return encodings[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar la imagen: {str(e)}")


@app.get("/")
def root():
    """Endpoint raíz"""
    return {
        "message": "Face Recognition API",
        "endpoints": {
            "/match": "POST - Recibe imagen en base64 y retorna match",
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
def match_face(request: ImageRequest):
    """
    Recibe una imagen en base64 y busca el mejor match en Supabase
    
    Args:
        request: Objeto con image_base64 (string) y threshold opcional (float, default 0.6)
    
    Returns:
        MatchResponse con información del match encontrado
    """
    try:
        # 1. Decodificar imagen desde base64
        image = decode_base64_image(request.image_base64)
        
        # 2. Calcular encoding facial
        target_encoding = calculate_face_encoding(image)
        
        # 3. Obtener encodings de Supabase
        try:
            response = supabase.table("known_people").select(
                "full_name, face_encoding, linkedin_content, discord_username"
            ).execute()
            people_db = response.data
            
            if not people_db:
                return MatchResponse(
                    match_found=False,
                    threshold=request.threshold,
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
                # Convertir lista JSON a numpy array
                db_encoding = np.array(person['face_encoding'])
                
                # Calcular distancia Euclidiana
                dist = np.linalg.norm(target_encoding - db_encoding)
                
                if dist < best_dist:
                    best_dist = dist
                    best_match = person['full_name']
                    match_details = person
            except Exception as e:
                # Continuar con el siguiente registro si hay error
                continue
        
        # 5. Determinar si hay match
        match_found = best_dist < request.threshold
        
        if match_found:
            return MatchResponse(
                match_found=True,
                person_name=best_match,
                distance=float(best_dist),
                threshold=request.threshold,
                linkedin_content=match_details.get('linkedin_content'),
                message=f"Match encontrado: {best_match}"
            )
        else:
            return MatchResponse(
                match_found=False,
                person_name=best_match if best_match else None,
                distance=float(best_dist) if best_match else None,
                threshold=request.threshold,
                message=f"No se encontró match. El más cercano fue {best_match} con distancia {best_dist:.4f}" if best_match else "No se encontraron coincidencias"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

