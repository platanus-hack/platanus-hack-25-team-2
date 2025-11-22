import os
import json
import tempfile
import requests
import face_recognition
from supabase import create_client, Client
from urllib.parse import urlparse

# Configuración de Supabase
# Se requiere la clave de servicio (Service Role Key) para saltarse las políticas RLS al subir archivos privados
SUPABASE_URL = "https://zgvntpcrofqtmuktrqjs.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("Error: La variable de entorno SUPABASE_SERVICE_ROLE_KEY no está configurada.")
    print("Por favor, ejecuta: export SUPABASE_SERVICE_ROLE_KEY='tu_clave_service_role'")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def download_image(url, output_path):
    """Descarga una imagen desde una URL y la guarda localmente"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Determinar extensión desde Content-Type o URL
        content_type = response.headers.get('content-type', '')
        if 'jpeg' in content_type or 'jpg' in content_type:
            ext = '.jpg'
        elif 'png' in content_type:
            ext = '.png'
        else:
            # Intentar desde URL
            parsed = urlparse(url)
            ext = os.path.splitext(parsed.path)[1] or '.jpg'
        
        # Asegurar que el output_path tenga la extensión correcta
        if not output_path.endswith(('.jpg', '.jpeg', '.png')):
            output_path += ext
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        return output_path
    except Exception as e:
        print(f"[ERROR] Error al descargar imagen desde {url}: {e}")
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
    """Procesa un perfil completo: descarga imagen, calcula embedding y sube a Supabase"""
    username = profile_data.get("username", "unknown")
    name = profile_data.get("name", "Unknown")
    profile_image_url = profile_data.get("profile_image_url")
    
    if not profile_image_url:
        print(f"[SKIP] {name} ({username}): No tiene URL de imagen de perfil")
        return
    
    print(f"\n{'='*60}")
    print(f"Procesando: {name} ({username})")
    print(f"{'='*60}")
    
    # 1. Descargar imagen de perfil
    temp_dir = tempfile.gettempdir()
    image_filename = f"{username}_profile.jpg"
    local_image_path = os.path.join(temp_dir, image_filename)
    
    print(f"[1/4] Descargando imagen desde {profile_image_url}...")
    downloaded_path = download_image(profile_image_url, local_image_path)
    
    if not downloaded_path or not os.path.exists(downloaded_path):
        print(f"[SKIP] {name}: No se pudo descargar la imagen")
        return
    
    print(f"[OK] Imagen descargada: {downloaded_path}")
    
    # 2. Calcular encoding facial
    print(f"[2/4] Calculando encoding facial...")
    try:
        image = face_recognition.load_image_file(downloaded_path)
        encodings = face_recognition.face_encodings(image)
        
        if not encodings:
            print(f"[WARN] {name}: No se detectó cara en la imagen. Saltando.")
            # Limpiar archivo temporal
            if os.path.exists(downloaded_path):
                os.remove(downloaded_path)
            return
        
        face_encoding = encodings[0].tolist()
        print(f"[OK] Encoding calculado (128 dimensiones)")
        
    except Exception as e:
        print(f"[ERROR] {name}: Error al procesar imagen: {e}")
        # Limpiar archivo temporal
        if os.path.exists(downloaded_path):
            os.remove(downloaded_path)
        return
    
    # 3. Subir imagen a Supabase Storage
    storage_path = f"profiles/{username}_profile.jpg"
    print(f"[3/4] Subiendo imagen a Supabase Storage...")
    try:
        with open(downloaded_path, 'rb') as f:
            file_content = f.read()
        
        # Determinar content-type
        content_type = "image/jpeg"
        if downloaded_path.endswith('.png'):
            content_type = "image/png"
        
        res = supabase.storage.from_("photos").upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        print(f"[OK] Imagen subida a storage: {storage_path}")
        
    except Exception as e:
        print(f"[ERROR] {name}: Error al subir a storage: {e}")
        # Limpiar archivo temporal
        if os.path.exists(downloaded_path):
            os.remove(downloaded_path)
        return
    
    # 4. Crear contenido de LinkedIn
    linkedin_content = create_linkedin_content(profile_data)
    
    # 5. Insertar datos en la base de datos
    print(f"[4/4] Insertando registro en base de datos...")
    try:
        data = {
            "full_name": name,
            "discord_username": username,
            "linkedin_content": linkedin_content,
            "photo_path": storage_path,
            "face_encoding": face_encoding
        }
        
        response = supabase.table("known_people").insert(data).execute()
        print(f"[OK] Registro insertado en DB para {name}")
        
    except Exception as e:
        print(f"[ERROR] {name}: Error al insertar en DB: {e}")
        print(f"      Detalles: {str(e)}")
    
    # Limpiar archivo temporal
    if os.path.exists(downloaded_path):
        os.remove(downloaded_path)
        print(f"[OK] Archivo temporal eliminado")

if __name__ == "__main__":
    json_file = "linkedin_profiles_data.json"
    
    if not os.path.exists(json_file):
        print(f"Error: El archivo {json_file} no existe.")
        exit(1)
    
    print("="*60)
    print("Iniciando carga de perfiles de LinkedIn a Supabase")
    print("="*60)
    
    # Leer JSON
    with open(json_file, 'r', encoding='utf-8') as f:
        profiles = json.load(f)
    
    print(f"\nTotal de perfiles encontrados: {len(profiles)}")
    
    # Filtrar perfiles con errores
    valid_profiles = [p for p in profiles if not p.get("error")]
    print(f"Perfiles válidos (sin errores): {len(valid_profiles)}")
    
    # Procesar cada perfil
    success_count = 0
    skip_count = 0
    
    for i, profile in enumerate(valid_profiles, 1):
        print(f"\n[{i}/{len(valid_profiles)}]")
        try:
            process_profile(profile)
            success_count += 1
        except Exception as e:
            print(f"[ERROR] Error procesando perfil: {e}")
            skip_count += 1
    
    print("\n" + "="*60)
    print("Proceso finalizado")
    print("="*60)
    print(f"Perfiles procesados exitosamente: {success_count}")
    print(f"Perfiles omitidos: {skip_count}")
    print(f"Total procesado: {success_count + skip_count}/{len(valid_profiles)}")

