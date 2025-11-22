import os
import face_recognition
import numpy as np
from supabase import create_client, Client

# Configuración de Supabase (Anon Key es suficiente ahora que tenemos política de lectura)
SUPABASE_URL = "https://zgvntpcrofqtmuktrqjs.supabase.co"
# Esta es la clave Anon pública (safe to commit in frontend apps, ok here for demo)
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpndm50cGNyb2ZxdG11a3RycWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODAwODgsImV4cCI6MjA3OTM1NjA4OH0.EqWHH-K3358RN5YDpAgB1oprDzf6yZzzhoTg2e6YodA"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def find_match_in_supabase(target_photo_path, threshold=0.6):
    print(f"Procesando foto objetivo: {target_photo_path}")
    
    # 1. Cargar y codificar foto local
    try:
        target_img = face_recognition.load_image_file(target_photo_path)
        target_encodings = face_recognition.face_encodings(target_img)
        
        if not target_encodings:
            print("❌ No se detectó ninguna cara en la foto objetivo.")
            return
        
        target_encoding = target_encodings[0]
        print("✅ Encoding de foto objetivo calculado.")
        
    except Exception as e:
        print(f"❌ Error al procesar archivo local: {e}")
        return

    # 2. Descargar encodings de Supabase
    print("Descargando base de datos de rostros desde Supabase...")
    try:
        # Seleccionamos solo lo necesario
        response = supabase.table("known_people").select("full_name, face_encoding, linkedin_content").execute()
        people_db = response.data
        
        if not people_db:
            print("⚠️ La tabla 'known_people' está vacía en Supabase.")
            return

        print(f"✅ Se descargaron {len(people_db)} perfiles de la nube.")
        
    except Exception as e:
        print(f"❌ Error conectando con Supabase: {e}")
        return

    # 3. Comparar
    print("\nComparando...")
    best_match = None
    best_dist = float("inf")
    match_details = None

    for person in people_db:
        # Convertir lista JSON a numpy array
        db_encoding = np.array(person['face_encoding'])
        
        # Calcular distancia Euclidiana
        dist = np.linalg.norm(target_encoding - db_encoding)
        print(f" - Distancia con {person['full_name']}: {dist:.4f}")
        
        if dist < best_dist:
            best_dist = dist
            best_match = person['full_name']
            match_details = person

    # 4. Resultado
    print("\n========== RESULTADO ==========")
    if best_dist < threshold:
        print(f"✅ ¡MATCH ENCONTRADO!")
        print(f"Identificado como: {best_match}")
        print(f"Distancia: {best_dist:.4f}")
        print("-" * 20)
        print("Información recuperada:")
        # Mostrar primeras lineas de linkedin content
        info = match_details.get('linkedin_content', 'Sin información')
        print('\n'.join(info.split('\n')[:5]))
        print("...")
    else:
        print("❌ No hay coincidencia con la base de datos.")
        print(f"El más cercano fue {best_match} con distancia {best_dist:.4f} (Umbral: {threshold})")

if __name__ == "__main__":
    TARGET = "test-photo-0.png" # La foto que el usuario quiere probar
    find_match_in_supabase(TARGET)

