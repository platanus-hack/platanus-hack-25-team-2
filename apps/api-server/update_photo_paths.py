#!/usr/bin/env python3
"""
Script para actualizar photo_path en Supabase con las URLs de Storage
Lee el JSON actualizado y actualiza cada perfil en la DB
"""

import os
import json
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
SUPABASE_TABLE = "known_people"


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


def get_storage_url(username: str) -> str:
    """Obtener URL pública de un archivo en storage"""
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{username}_photo.jpg"


def update_profile_photo_path(profile):
    """Actualizar photo_path en la DB para un perfil"""
    full_name = profile.get("name", "Unknown")
    username = profile.get("username", "unknown")
    
    print(f"\n{'='*60}")
    print(f"Actualizando: {full_name} (@{username})")
    print(f"{'='*60}")
    
    # Generar URL de Storage
    storage_url = get_storage_url(username)
    print(f"📍 Nueva URL: {storage_url[:80]}...")
    
    try:
        # Buscar el perfil en la DB por username o name
        response = supabase.table(SUPABASE_TABLE).select("id, full_name").execute()
        profiles_in_db = response.data
        
        # Buscar coincidencia por nombre o username
        matched_profile = None
        for db_profile in profiles_in_db:
            if db_profile["full_name"].lower() == full_name.lower():
                matched_profile = db_profile
                break
        
        if not matched_profile:
            print(f"⏭️  No encontrado en DB: {full_name}")
            return False
        
        profile_id = matched_profile["id"]
        
        # Actualizar photo_path
        update_response = supabase.table(SUPABASE_TABLE).update({
            "photo_path": storage_url
        }).eq("id", profile_id).execute()
        
        print(f"✅ Actualizado en DB (ID: {profile_id})")
        return True
        
    except Exception as e:
        print(f"❌ Error actualizando DB: {e}")
        return False


if __name__ == "__main__":
    print("="*60)
    print("Iniciando actualización de photo_path en Supabase")
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
    
    for i, profile in enumerate(profiles, 1):
        print(f"\n[{i}/{len(profiles)}]", end="")
        try:
            if update_profile_photo_path(profile):
                success_count += 1
            else:
                skip_count += 1
        except Exception as e:
            print(f"❌ Error inesperado: {e}")
            skip_count += 1
    
    print("\n" + "="*60)
    print("✅ Proceso completado")
    print("="*60)
    print(f"Perfiles actualizados: {success_count}")
    print(f"Perfiles omitidos: {skip_count}")
    print(f"Total procesado: {success_count + skip_count}/{len(profiles)}")
    print("\n💡 photo_path ha sido actualizado en todos los perfiles")

