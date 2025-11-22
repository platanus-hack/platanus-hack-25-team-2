"""
Script para procesar linkedin_mentors_output.json y agregar perfiles a la DB
con embeddings de Face-API (128 dims) y DeepFace (512 dims).
"""

import os
import json
import tempfile
import requests
import face_recognition
import numpy as np
from supabase import create_client, Client
from urllib.parse import urlparse

# DeepFace es opcional - si no está instalado, solo se calculará Face-API
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("⚠️  DeepFace no está instalado. Solo se calcularán embeddings de Face-API.")
    print("   Para instalar: pip install deepface")

# Configuración de Supabase
SUPABASE_URL = "https://zgvntpcrofqtmuktrqjs.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpndm50cGNyb2ZxdG11a3RycWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODAwODgsImV4cCI6MjA3OTM1NjA4OH0.EqWHH-K3358RN5YDpAgB1oprDzf6yZzzhoTg2e6YodA"

if not SUPABASE_KEY:
    print("Error: La variable de entorno SUPABASE_SERVICE_ROLE_KEY no está configurada.")
    print("Por favor, ejecuta: export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configuración de modelos
DEEPFACE_MODEL = "Facenet512"  # Genera embeddings de 512 dimensiones


def download_image(url, output_path):
    """Descarga una imagen desde una URL y la guarda localmente"""
    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        # Determinar extensión desde Content-Type o URL
        content_type = response.headers.get('content-type', '')
        if 'jpeg' in content_type or 'jpg' in content_type:
            ext = '.jpg'
        elif 'png' in content_type:
            ext = '.png'
        elif 'webp' in content_type:
            ext = '.webp'
        else:
            # Intentar desde URL
            parsed = urlparse(url)
            ext = os.path.splitext(parsed.path)[1] or '.jpg'
        
        # Asegurar que el output_path tenga la extensión correcta
        if not output_path.endswith(('.jpg', '.jpeg', '.png', '.webp')):
            output_path += ext
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        return output_path
    except Exception as e:
        print(f"[ERROR] Error al descargar imagen desde {url}: {e}")
        return None


def calculate_faceapi_embedding(image_path):
    """Calcula el embedding con face_recognition (face-api equivalente de 128 dims)"""
    try:
        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)
        
        if not encodings:
            return None
        
        # face_recognition usa 128 dimensiones
        return encodings[0].tolist()
    except Exception as e:
        print(f"[ERROR] Error al calcular embedding con face-api: {e}")
        return None


def calculate_deepface_embedding(image_path, model_name=DEEPFACE_MODEL):
    """
    Calcula el embedding usando DeepFace con el modelo especificado.
    Facenet512 genera embeddings de 512 dimensiones.
    """
    if not DEEPFACE_AVAILABLE:
        return None
    
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
        return embedding
        
    except Exception as e:
        print(f"[ERROR] Error al calcular embedding con DeepFace: {e}")
        return None


def create_linkedin_content(profile_data):
    """Crea un string con el contenido completo del perfil de LinkedIn"""
    content_parts = []
    
    if profile_data.get("name"):
        content_parts.append(f"Nombre: {profile_data['name']}")
    
    if profile_data.get("headline"):
        content_parts.append(f"Headline: {profile_data['headline']}")
    
    if profile_data.get("location"):
        content_parts.append(f"Ubicación: {profile_data['location']}")
    
    if profile_data.get("linkedin_url"):
        content_parts.append(f"LinkedIn URL: {profile_data['linkedin_url']}")
    
    if profile_data.get("scraped_at"):
        content_parts.append(f"Fecha de scraping: {profile_data['scraped_at']}")
    
    if profile_data.get("about"):
        content_parts.append(f"\nAcerca de:\n{profile_data['about']}")
    
    if profile_data.get("experience"):
        content_parts.append("\nExperiencia:")
        for exp in profile_data['experience']:
            exp_str = f"- {exp.get('title', 'N/A')}"
            if exp.get('company'):
                exp_str += f" en {exp['company']}"
            content_parts.append(exp_str)
    
    if profile_data.get("education"):
        content_parts.append("\nEducación:")
        for edu in profile_data['education']:
            edu_str = f"- {edu.get('school', 'N/A')}"
            if edu.get('degree'):
                edu_str += f": {edu['degree']}"
            content_parts.append(edu_str)
    
    if profile_data.get("skills"):
        content_parts.append("\nHabilidades:")
        for skill in profile_data['skills']:
            content_parts.append(f"- {skill}")
    
    return "\n".join(content_parts)


def process_profile(profile_data):
    """Procesa un perfil: descarga imagen, calcula ambos embeddings, guarda en DB"""
    username = profile_data.get("username", "unknown")
    name = profile_data.get("name", "Unknown")
    profile_image_url = profile_data.get("profile_image_url")
    
    # Validaciones
    if profile_data.get("error"):
        print(f"[SKIP] {name} ({username}): Tiene error en los datos: {profile_data.get('error')}")
        return False
    
    if not profile_image_url:
        print(f"[SKIP] {name} ({username}): No tiene URL de imagen de perfil")
        return False
    
    print(f"\n{'='*60}")
    print(f"Procesando: {name} ({username})")
    print(f"{'='*60}")
    
    # 1. Descargar imagen de perfil
    temp_dir = tempfile.gettempdir()
    image_filename = f"{username}_profile.jpg"
    local_image_path = os.path.join(temp_dir, image_filename)
    
    print(f"[1/3] Descargando imagen desde {profile_image_url}...")
    downloaded_path = download_image(profile_image_url, local_image_path)
    
    if not downloaded_path or not os.path.exists(downloaded_path):
        print(f"[ERROR] {name}: No se pudo descargar la imagen")
        return False
    
    print(f"[OK] Imagen descargada: {downloaded_path}")
    
    # 2. Calcular embedding con Face-API (128 dimensiones)
    print(f"[2/3] Calculando embedding con Face-API (128 dimensiones)...")
    face_encoding_faceapi = calculate_faceapi_embedding(downloaded_path)
    
    if not face_encoding_faceapi:
        print(f"[WARNING] {name}: No se pudo calcular embedding con Face-API")
        # Continuar de todas formas para intentar DeepFace
    
    # 3. Calcular embedding con DeepFace (512 dimensiones)
    face_encoding_deepface = None
    if DEEPFACE_AVAILABLE:
        print(f"[3/3] Calculando embedding con DeepFace {DEEPFACE_MODEL} (512 dimensiones)...")
        face_encoding_deepface = calculate_deepface_embedding(downloaded_path, DEEPFACE_MODEL)
        
        if face_encoding_deepface:
            print(f"[OK] Embedding DeepFace calculado ({len(face_encoding_deepface)} dimensiones)")
        else:
            print(f"[WARNING] {name}: No se pudo calcular embedding con DeepFace")
    else:
        print(f"[SKIP] DeepFace no disponible, solo se guardará Face-API")
    
    # Validar que al menos uno de los embeddings se calculó
    if not face_encoding_faceapi and not face_encoding_deepface:
        print(f"[ERROR] {name}: No se pudo calcular ningún embedding")
        if os.path.exists(downloaded_path):
            os.remove(downloaded_path)
        return False
    
    # Limpiar archivo temporal
    if os.path.exists(downloaded_path):
        os.remove(downloaded_path)
    
    # 4. Crear contenido de LinkedIn
    linkedin_content = create_linkedin_content(profile_data)
    
    # 5. Insertar datos en la base de datos
    print(f"[4/4] Insertando registro en base de datos...")
    try:
        # Usar la URL de la imagen directamente como photo_path
        photo_path = profile_image_url
        
        # Preparar datos para insertar
        # face_encoding es NOT NULL, así que debemos asegurar que siempre tenga un valor
        data = {
            "full_name": name,
            "discord_username": username,
            "linkedin_content": linkedin_content,
            "photo_path": photo_path,
        }
        
        # Agregar embeddings si están disponibles
        if face_encoding_faceapi:
            data["face_encoding_faceapi"] = face_encoding_faceapi
        
        if face_encoding_deepface:
            # Usar face_encoding para DeepFace (512 dims) como embedding principal
            data["face_encoding"] = face_encoding_deepface
            # También guardar en columna específica
            data["face_encoding_deepface_512"] = face_encoding_deepface
        elif face_encoding_faceapi:
            # Si solo tenemos Face-API, usarlo como face_encoding principal (requerido)
            data["face_encoding"] = face_encoding_faceapi
        else:
            # Esto no debería pasar porque validamos antes, pero por seguridad
            raise ValueError("No hay embeddings disponibles para guardar")
        
        response = supabase.table("known_people").insert(data).execute()
        print(f"[OK] Registro insertado en DB para {name}")
        print(f"     - Face-API: {len(face_encoding_faceapi) if face_encoding_faceapi else 'N/A'} dimensiones")
        print(f"     - DeepFace: {len(face_encoding_deepface) if face_encoding_deepface else 'N/A'} dimensiones")
        
    except Exception as e:
        print(f"[ERROR] {name}: Error al insertar en DB: {e}")
        print(f"      Detalles: {str(e)}")
        return False
    
    return True


if __name__ == "__main__":
    import sys
    
    # Obtener nombre del archivo JSON desde argumentos o usar default
    if len(sys.argv) > 1:
        json_file = sys.argv[1]
    else:
        json_file = "linkedin_mentors_output.json"
    
    if not os.path.exists(json_file):
        print(f"Error: El archivo {json_file} no existe.")
        print(f"Uso: python upload_linkedin_mentors.py [archivo.json]")
        exit(1)
    
    print("="*60)
    print("Iniciando carga de perfiles de LinkedIn")
    print("Calculando embeddings con Face-API y DeepFace")
    print("="*60)
    
    if not DEEPFACE_AVAILABLE:
        print("\n⚠️  ADVERTENCIA: DeepFace no está instalado.")
        print("   Solo se calcularán embeddings de Face-API (128 dimensiones).")
        print("   Para calcular también DeepFace: pip install deepface\n")
    
    # Leer JSON
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            profiles = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: El archivo JSON no es válido: {e}")
        exit(1)
    except Exception as e:
        print(f"Error al leer el archivo: {e}")
        exit(1)
    
    # Asegurar que profiles es una lista
    if not isinstance(profiles, list):
        print("Error: El JSON debe ser un array de perfiles")
        exit(1)
    
    print(f"\nTotal de perfiles encontrados: {len(profiles)}")
    
    # Filtrar perfiles con errores o sin datos necesarios
    valid_profiles = [
        p for p in profiles 
        if not p.get("error") 
        and p.get("name")
        and p.get("profile_image_url")
    ]
    print(f"Perfiles válidos (con imagen): {len(valid_profiles)}")
    
    if len(valid_profiles) == 0:
        print("No hay perfiles válidos para procesar.")
        exit(1)
    
    # Procesar cada perfil
    success_count = 0
    skip_count = 0
    
    for i, profile in enumerate(valid_profiles, 1):
        print(f"\n[{i}/{len(valid_profiles)}]")
        try:
            if process_profile(profile):
                success_count += 1
            else:
                skip_count += 1
        except Exception as e:
            print(f"[ERROR] Error procesando perfil: {e}")
            import traceback
            traceback.print_exc()
            skip_count += 1
    
    print("\n" + "="*60)
    print("Proceso finalizado")
    print("="*60)
    print(f"Perfiles procesados exitosamente: {success_count}")
    print(f"Perfiles omitidos: {skip_count}")
    print(f"Total procesado: {success_count + skip_count}/{len(valid_profiles)}")
    print("\nEmbeddings guardados:")
    print("- face_encoding_faceapi: 128 dimensiones (Face-API)")
    if DEEPFACE_AVAILABLE:
        print("- face_encoding / face_encoding_deepface_512: 512 dimensiones (DeepFace Facenet512)")

