#!/usr/bin/env python3
"""
Script para subir las fotos de los perfiles a Supabase Storage
Lee las URLs de las fotos del JSON, las descarga, y las sube a Storage
"""

import os
import json
import tempfile
import requests
from urllib.parse import urlparse
from supabase import create_client, Client

from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Las variables SUPABASE_URL y SUPABASE_KEY (o SUPABASE_SERVICE_ROLE_KEY) deben estar configuradas en el archivo .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

STORAGE_BUCKET = "photos"
JSON_FILE = "linkedin_profiles_data.json"


def load_profiles_from_json():
    """Cargar perfiles del JSON"""
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, dict) and 'profiles' in data:
                return data['profiles']
            elif isinstance(data, list):
                return data
        return []
    except FileNotFoundError:
        print(f"❌ Error: No se encontró el archivo {JSON_FILE}")
        return []


def download_image(url: str, output_path: str) -> bool:
    """Descargar imagen desde URL"""
    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        # Determinar extensión desde content-type o URL
        content_type = response.headers.get('content-type', '')
        if 'jpeg' in content_type or 'jpg' in content_type:
            ext = '.jpg'
        elif 'png' in content_type:
            ext = '.png'
        elif 'webp' in content_type:
            ext = '.webp'
        else:
            parsed = urlparse(url)
            ext = os.path.splitext(parsed.path)[1] or '.jpg'
        
        # Asegurar que el archivo tenga extensión
        if not output_path.endswith(('.jpg', '.jpeg', '.png', '.webp')):
            output_path += ext
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        return output_path
    except Exception as e:
        print(f"❌ Error descargando {url}: {e}")
        return None


def upload_to_storage(file_path: str, storage_path: str) -> bool:
    """Subir archivo a Supabase Storage"""
    try:
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Subir archivo usando la API correcta de supabase-py
        response = supabase.storage.from_(STORAGE_BUCKET).upload(
            path=storage_path,
            file=file_data
        )
        
        return True
    except Exception as e:
        print(f"❌ Error subiendo a storage: {e}")
        return False


def get_storage_url(storage_path: str) -> str:
    """Obtener URL pública de un archivo en storage"""
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"


def upload_profile_photo(profile, profile_id=None):
    """Descargar foto de perfil y subirla a storage"""
    full_name = profile.get("name", "Unknown")
    username = profile.get("username", "unknown")
    photo_url = profile.get("profile_image_url")
    
    if not photo_url:
        print(f"⏭️  {full_name}: Sin URL de foto")
        return False
    
    print(f"\n{'='*60}")
    print(f"Procesando: {full_name} (@{username})")
    print(f"{'='*60}")
    
    # Crear nombre para guardar
    storage_path = f"{username}_photo.jpg"
    
    # Descargar imagen
    temp_dir = tempfile.gettempdir()
    local_file = os.path.join(temp_dir, f"{username}_profile.jpg")
    
    print(f"📥 Descargando foto de: {photo_url[:70]}...")
    downloaded_path = download_image(photo_url, local_file)
    
    if not downloaded_path or not os.path.exists(downloaded_path):
        print(f"❌ No se pudo descargar la foto")
        return False
    
    print(f"✅ Foto descargada: {downloaded_path}")
    
    # Subir a storage
    print(f"📤 Subiendo a storage: {storage_path}...")
    if not upload_to_storage(downloaded_path, storage_path):
        print(f"❌ Error subiendo a storage")
        if os.path.exists(downloaded_path):
            os.remove(downloaded_path)
        return False
    
    print(f"✅ Foto subida a storage")
    
    # Obtener URL pública de Storage
    storage_url = get_storage_url(storage_path)
    print(f"✅ URL pública: {storage_url[:80]}...")
    
    # Limpiar archivo temporal
    if os.path.exists(downloaded_path):
        os.remove(downloaded_path)
        print(f"🧹 Archivo temporal eliminado")
    
    return True


if __name__ == "__main__":
    print("="*60)
    print("Iniciando carga de fotos a Supabase Storage")
    print("="*60)
    
    # Cargar perfiles desde JSON
    profiles = load_profiles_from_json()
    if not profiles:
        print("❌ No se encontraron perfiles en el JSON")
        exit(1)
    
    print(f"\n✅ Se encontraron {len(profiles)} perfiles en el JSON")
    
    # Procesar cada perfil
    success_count = 0
    skip_count = 0
    updated_profiles = []
    
    for i, profile in enumerate(profiles, 1):
        print(f"\n[{i}/{len(profiles)}]", end="")
        try:
            if upload_profile_photo(profile):
                # Si la foto se subió correctamente, actualizar la URL en el perfil
                username = profile.get("username", "unknown")
                storage_url = get_storage_url(f"{username}_photo.jpg")
                profile["profile_image_url"] = storage_url
                updated_profiles.append(profile)
                success_count += 1
            else:
                updated_profiles.append(profile)
                skip_count += 1
        except Exception as e:
            print(f"❌ Error inesperado: {e}")
            updated_profiles.append(profile)
            skip_count += 1
    
    # Guardar el JSON actualizado
    print("\n💾 Guardando JSON actualizado...")
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated_profiles, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*60)
    print("✅ Proceso completado")
    print("="*60)
    print(f"Fotos subidas exitosamente: {success_count}")
    print(f"Fotos omitidas/fallidas: {skip_count}")
    print(f"Total procesado: {success_count + skip_count}/{len(profiles)}")
    print(f"\n💡 JSON actualizado: {JSON_FILE}")

