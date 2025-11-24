"""
Script para calcular embeddings faciales usando DeepFace con modelos de más dimensiones.
DeepFace soporta varios modelos:
- Facenet512: 512 dimensiones
- ArcFace: 512 dimensiones  
- Dlib: 128 dimensiones
- OpenFace: 128 dimensiones
- DeepID: 160 dimensiones
- VGG-Face: 2622 dimensiones (muy grande)
"""

import os
import tempfile
import requests
from deepface import DeepFace
from supabase import create_client, Client
import numpy as np

from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

# Modelo a usar (puedes cambiar entre: Facenet512, ArcFace, etc.)
MODEL_NAME = "Facenet512"  # Genera embeddings de 512 dimensiones
EMBEDDING_COLUMN = "face_encoding_deepface_512"  # Nueva columna en la DB

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Las variables SUPABASE_URL y SUPABASE_KEY (o SUPABASE_SERVICE_ROLE_KEY) deben estar configuradas en el archivo .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def download_image(url, output_path):
    """Descarga una imagen desde una URL"""
    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        return output_path
    except Exception as e:
        print(f"[ERROR] Error al descargar imagen: {e}")
        return None


def calculate_deepface_embedding(image_path, model_name=MODEL_NAME):
    """
    Calcula el embedding usando DeepFace con el modelo especificado.
    
    Modelos disponibles y sus dimensiones:
    - Facenet512: 512 dimensiones
    - ArcFace: 512 dimensiones
    - Dlib: 128 dimensiones
    - OpenFace: 128 dimensiones
    - DeepID: 160 dimensiones
    - VGG-Face: 2622 dimensiones (muy grande, no recomendado)
    """
    try:
        # DeepFace.represent devuelve una lista de embeddings (uno por cara detectada)
        result = DeepFace.represent(
            img_path=image_path,
            model_name=model_name,
            enforce_detection=False,  # No fallar si no detecta cara
            detector_backend='opencv'  # Backend de detección
        )
        
        if not result or len(result) == 0:
            return None
        
        # Tomar el primer embedding (primera cara detectada)
        embedding = result[0]['embedding']
        
        print(f"  ✓ Embedding calculado: {len(embedding)} dimensiones")
        return embedding
        
    except Exception as e:
        print(f"[ERROR] Error al calcular embedding con DeepFace: {e}")
        return None


def process_existing_profiles():
    """Procesa perfiles existentes y agrega embedding de DeepFace"""
    try:
        # Obtener todos los perfiles
        response = supabase.table("known_people").select("*").execute()
        profiles = response.data
        
        if not profiles:
            print("No hay perfiles en la base de datos")
            return
        
        print(f"Total de perfiles encontrados: {len(profiles)}")
        print(f"Modelo: {MODEL_NAME}")
        print(f"Columna DB: {EMBEDDING_COLUMN}")
        print(f"Descargando imágenes y calculando embeddings...\n")
        
        success_count = 0
        skip_count = 0
        
        for i, profile in enumerate(profiles, 1):
            profile_id = profile['id']
            name = profile['full_name']
            photo_path = profile['photo_path']
            
            print(f"[{i}/{len(profiles)}] Procesando: {name}")
            
            # Saltar si ya tiene embedding de DeepFace
            if profile.get(EMBEDDING_COLUMN):
                print(f"  ✓ Ya tiene embedding de DeepFace")
                skip_count += 1
                continue
            
            if not photo_path:
                print(f"  ✗ No tiene URL de imagen")
                skip_count += 1
                continue
            
            # Descargar imagen
            temp_dir = tempfile.gettempdir()
            image_path = os.path.join(temp_dir, f"{profile_id}_deepface.jpg")
            
            print(f"  Descargando imagen...")
            downloaded_path = download_image(photo_path, image_path)
            
            if not downloaded_path:
                print(f"  ✗ Error al descargar")
                skip_count += 1
                continue
            
            # Calcular embedding
            print(f"  Calculando embedding con {MODEL_NAME}...")
            embedding = calculate_deepface_embedding(downloaded_path, MODEL_NAME)
            
            if not embedding:
                print(f"  ✗ No se pudo calcular embedding")
                if os.path.exists(downloaded_path):
                    os.remove(downloaded_path)
                skip_count += 1
                continue
            
            # Actualizar en DB
            print(f"  Actualizando DB...")
            try:
                supabase.table("known_people").update({
                    EMBEDDING_COLUMN: embedding
                }).eq("id", profile_id).execute()
                
                print(f"  ✓ Actualizado ({len(embedding)} dims)")
                success_count += 1
            except Exception as e:
                print(f"  ✗ Error al actualizar: {e}")
                skip_count += 1
            
            # Limpiar archivo temporal
            if os.path.exists(downloaded_path):
                os.remove(downloaded_path)
        
        print(f"\n{'='*60}")
        print(f"Proceso finalizado")
        print(f"{'='*60}")
        print(f"Perfiles actualizados: {success_count}")
        print(f"Perfiles omitidos/con error: {skip_count}")
        print(f"Total: {success_count + skip_count}/{len(profiles)}")
        
    except Exception as e:
        print(f"Error general: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("="*60)
    print(f"Agregando embeddings de DeepFace ({MODEL_NAME}) a perfiles existentes")
    print("="*60 + "\n")
    
    print("⚠️  NOTA: Este script requiere instalar DeepFace:")
    print("   pip install deepface")
    print("   (La primera vez descargará los modelos automáticamente)\n")
    
    process_existing_profiles()

