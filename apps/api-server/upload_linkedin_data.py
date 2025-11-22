import os
import json
from supabase import create_client, Client

# Configuración de Supabase
# Se requiere la clave de servicio (Service Role Key) para saltarse las políticas RLS al subir archivos privados
SUPABASE_URL = "https://zgvntpcrofqtmuktrqjs.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpndm50cGNyb2ZxdG11a3RycWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODAwODgsImV4cCI6MjA3OTM1NjA4OH0.EqWHH-K3358RN5YDpAgB1oprDzf6yZzzhoTg2e6YodA"

if not SUPABASE_KEY:
    print("Error: La variable de entorno SUPABASE_SERVICE_ROLE_KEY no está configurada.")
    print("Por favor, ejecuta: export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


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
    
    # Agregar metadata del embedding si existe
    if profile_data.get("embedding_metadata"):
        metadata = profile_data['embedding_metadata']
        content_parts.append(f"\nMetadata del embedding:")
        content_parts.append(f"- Modelo: {metadata.get('model', 'N/A')}")
        content_parts.append(f"- Detector: {metadata.get('detector', 'N/A')}")
        content_parts.append(f"- Tamaño: {metadata.get('embedding_size', 'N/A')} dimensiones")
        content_parts.append(f"- Procesado: {metadata.get('processed_at', 'N/A')}")
    
    return "\n".join(content_parts)


def process_profile(profile_data):
    """Procesa un perfil completo: usa el embedding del JSON y guarda en DB"""
    username = profile_data.get("username", "unknown")
    name = profile_data.get("name", "Unknown")
    profile_image_url = profile_data.get("profile_image_url")
    face_embedding = profile_data.get("face_embedding")
    
    # Validaciones
    if not face_embedding:
        print(f"[SKIP] {name} ({username}): No tiene face_embedding")
        return False
    
    if profile_data.get("error"):
        print(f"[SKIP] {name} ({username}): Tiene error en los datos: {profile_data.get('error')}")
        return False
    
    print(f"\n{'='*60}")
    print(f"Procesando: {name} ({username})")
    print(f"{'='*60}")
    
    # Crear contenido de LinkedIn
    print(f"[1/2] Creando contenido de LinkedIn...")
    linkedin_content = create_linkedin_content(profile_data)
    
    # Insertar datos en la base de datos
    print(f"[2/2] Insertando registro en base de datos...")
    try:
        # Convertir face_embedding a lista si no lo es ya
        face_encoding = face_embedding
        if not isinstance(face_encoding, list):
            face_encoding = list(face_encoding)
        
        # Usar la URL de la imagen directamente como photo_path
        photo_path = profile_image_url if profile_image_url else f"profiles/{username}_profile.jpg"
        
        data = {
            "full_name": name,
            "discord_username": username,
            "linkedin_content": linkedin_content,
            "photo_path": photo_path,
            "face_encoding": face_encoding
        }
        
        response = supabase.table("known_people").insert(data).execute()
        print(f"[OK] Registro insertado en DB para {name}")
        
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
        json_file = "linkedin_profiles_with_embeddings.json"
    
    if not os.path.exists(json_file):
        print(f"Error: El archivo {json_file} no existe.")
        print(f"Uso: python upload_linkedin_data.py [archivo.json]")
        exit(1)
    
    print("="*60)
    print("Iniciando carga de perfiles de LinkedIn con embeddings a Supabase")
    print("="*60)
    
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
        and p.get("face_embedding") 
        and p.get("name")
    ]
    print(f"Perfiles válidos: {len(valid_profiles)}")
    
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
            skip_count += 1
    
    print("\n" + "="*60)
    print("Proceso finalizado")
    print("="*60)
    print(f"Perfiles procesados exitosamente: {success_count}")
    print(f"Perfiles omitidos: {skip_count}")
    print(f"Total procesado: {success_count + skip_count}/{len(valid_profiles)}")

