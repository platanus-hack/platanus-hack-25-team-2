#!/usr/bin/env python3
"""
Script para calcular embeddings de face-api desde las fotos en Storage
Lee los perfiles de la DB, descarga las fotos del Storage, calcula embeddings
y actualiza face_encoding_faceapi en la DB
"""

import os
import tempfile
import requests
import face_recognition
import numpy as np
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

SUPABASE_TABLE = "known_people"


def download_image_from_url(url: str, output_path: str) -> bool:
    """Descargar imagen desde URL"""
    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        return True
    except Exception as e:
        print(f"❌ Error descargando imagen: {e}")
        return False


def calculate_face_encoding(image_path: str):
    """Calcular embedding facial con face_recognition (128 dimensiones)"""
    try:
        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)
        
        if not encodings:
            return None
        
        # Retornar el primer encoding como lista
        return encodings[0].tolist()
    except Exception as e:
        print(f"❌ Error calculando encoding: {e}")
        return None


def process_profile(profile):
    """Procesar un perfil: descargar foto, calcular embedding, actualizar DB"""
    profile_id = profile.get("id")
    full_name = profile.get("full_name", "Unknown")
    photo_path = profile.get("photo_path")
    
    # Saltar si ya tiene embedding
    if profile.get("face_encoding_faceapi"):
        print(f"⏭️  {full_name}: Ya tiene face_encoding_faceapi")
        return False
    
    if not photo_path:
        print(f"⏭️  {full_name}: Sin photo_path")
        return False
    
    print(f"\n{'='*60}")
    print(f"Procesando: {full_name}")
    print(f"{'='*60}")
    
    # Descargar imagen
    temp_dir = tempfile.gettempdir()
    local_image_path = os.path.join(temp_dir, f"{full_name.replace(' ', '_')}_face.jpg")
    
    print(f"📥 Descargando foto de: {photo_path[:70]}...")
    if not download_image_from_url(photo_path, local_image_path):
        print(f"❌ No se pudo descargar la imagen")
        return False
    
    print(f"✅ Foto descargada")
    
    # Calcular encoding
    print(f"🧠 Calculando embedding facial (128 dimensiones)...")
    face_encoding = calculate_face_encoding(local_image_path)
    
    if not face_encoding:
        print(f"⚠️  No se detectó cara en la imagen")
        if os.path.exists(local_image_path):
            os.remove(local_image_path)
        return False
    
    print(f"✅ Embedding calculado")
    
    # Actualizar DB
    try:
        update_response = supabase.table(SUPABASE_TABLE).update({
            "face_encoding_faceapi": face_encoding
        }).eq("id", profile_id).execute()
        
        print(f"✅ Actualizado en DB")
        success = True
    except Exception as e:
        print(f"❌ Error actualizando DB: {e}")
        success = False
    
    # Limpiar archivo temporal
    if os.path.exists(local_image_path):
        os.remove(local_image_path)
        print(f"🧹 Archivo temporal eliminado")
    
    return success


if __name__ == "__main__":
    print("="*60)
    print("Iniciando cálculo de embeddings desde Storage")
    print("="*60)
    
    try:
        # Obtener todos los perfiles
        response = supabase.table(SUPABASE_TABLE).select(
            "id, full_name, photo_path, face_encoding_faceapi"
        ).execute()
        
        all_profiles = response.data
        print(f"\n✅ Se encontraron {len(all_profiles)} perfiles en DB")
        
    except Exception as e:
        print(f"❌ Error obteniendo perfiles: {e}")
        exit(1)
    
    # Contar perfiles sin embedding
    profiles_without_embedding = [p for p in all_profiles if not p.get("face_encoding_faceapi")]
    print(f"⚠️  Perfiles sin embedding: {len(profiles_without_embedding)}")
    
    # Procesar cada perfil sin embedding
    success_count = 0
    skip_count = 0
    
    for i, profile in enumerate(profiles_without_embedding, 1):
        print(f"\n[{i}/{len(profiles_without_embedding)}]", end="")
        try:
            if process_profile(profile):
                success_count += 1
            else:
                skip_count += 1
        except Exception as e:
            print(f"❌ Error inesperado: {e}")
            skip_count += 1
    
    print("\n" + "="*60)
    print("✅ Proceso completado")
    print("="*60)
    print(f"Embeddings calculados: {success_count}")
    print(f"Perfiles omitidos/fallidos: {skip_count}")
    print(f"Total procesado: {success_count + skip_count}/{len(profiles_without_embedding)}")
    print("\n💡 face_encoding_faceapi ha sido calculado para todos los perfiles")

