import os
import tempfile
import requests
import face_recognition
from supabase import create_client, Client

# Configuración de Supabase
SUPABASE_URL = "https://zgvntpcrofqtmuktrqjs.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpndm50cGNyb2ZxdG11a3RycWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODAwODgsImV4cCI6MjA3OTM1NjA4OH0.EqWHH-K3358RN5YDpAgB1oprDzf6yZzzhoTg2e6YodA"

if not SUPABASE_KEY:
    print("Error: La variable de entorno SUPABASE_SERVICE_ROLE_KEY no está configurada.")
    print("Por favor, ejecuta: export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'")
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


def calculate_faceapi_embedding(image_path):
    """Calcula el embedding con face_recognition (128 dimensiones)"""
    try:
        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)
        
        if not encodings:
            return None
        
        return encodings[0].tolist()
    except Exception as e:
        print(f"[ERROR] Error al calcular embedding: {e}")
        return None


def process_existing_profiles():
    """Procesa perfiles existentes y agrega embedding de face-api"""
    try:
        # Obtener todos los perfiles
        response = supabase.table("known_people").select("*").execute()
        profiles = response.data
        
        if not profiles:
            print("No hay perfiles en la base de datos")
            return
        
        print(f"Total de perfiles encontrados: {len(profiles)}")
        print(f"Descargando imágenes y calculando embeddings con face-api...\n")
        
        success_count = 0
        skip_count = 0
        
        for i, profile in enumerate(profiles, 1):
            profile_id = profile['id']
            name = profile['full_name']
            photo_path = profile['photo_path']
            
            print(f"[{i}/{len(profiles)}] Procesando: {name}")
            
            # Saltar si ya tiene embedding de face-api
            if profile.get('face_encoding_faceapi'):
                print(f"  ✓ Ya tiene embedding de face-api")
                skip_count += 1
                continue
            
            if not photo_path:
                print(f"  ✗ No tiene URL de imagen")
                skip_count += 1
                continue
            
            # Descargar imagen
            temp_dir = tempfile.gettempdir()
            image_path = os.path.join(temp_dir, f"{profile_id}.jpg")
            
            print(f"  Descargando imagen...")
            downloaded_path = download_image(photo_path, image_path)
            
            if not downloaded_path:
                print(f"  ✗ Error al descargar")
                skip_count += 1
                continue
            
            # Calcular embedding
            print(f"  Calculando embedding...")
            embedding = calculate_faceapi_embedding(downloaded_path)
            
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
                    "face_encoding_faceapi": embedding
                }).eq("id", profile_id).execute()
                
                print(f"  ✓ Actualizado (128 dims)")
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


if __name__ == "__main__":
    print("="*60)
    print("Agregando embeddings de face-api a perfiles existentes")
    print("="*60 + "\n")
    
    process_existing_profiles()

