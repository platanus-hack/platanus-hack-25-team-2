import face_recognition
import numpy as np
import os

# 1. Cargar base de datos de caras
def load_database(folder_path):
    db_embeddings = {}
    for filename in os.listdir(folder_path):
        if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        path = os.path.join(folder_path, filename)
        image = face_recognition.load_image_file(path)

        encodings = face_recognition.face_encodings(image)
        if not encodings:
            print(f"[ADVERTENCIA] No se detectó ninguna cara en: {filename}")
            continue

        db_embeddings[filename] = encodings[0]
        print(f"[OK] Cara registrada desde: {filename}")

    return db_embeddings

# 2. Buscar mejor match para una foto objetivo
def find_best_match(target_path, db_embeddings, threshold=0.6):
    target_img = face_recognition.load_image_file(target_path)
    target_encodings = face_recognition.face_encodings(target_img)

    if not target_encodings:
        print("[ERROR] No se detectó ninguna cara en la foto objetivo.")
        return None, None

    target_enc = target_encodings[0]

    best_match = None
    best_dist = float("inf")

    for name, emb in db_embeddings.items():
        dist = np.linalg.norm(target_enc - emb)
        print(f"Distancia con {name}: {dist:.4f}")
        if dist < best_dist:
            best_dist = dist
            best_match = name

    # ¿Es la misma persona?
    is_same = best_dist < threshold if best_match is not None else False
    return best_match, best_dist, is_same

if __name__ == "__main__":
    # Archivos proporcionados por el usuario
    KNOWN_PHOTO = "linkedin-photo.png"  # Foto de referencia (LinkedIn)
    TARGET_PHOTO = "test-photo.png"     # Foto a verificar (Celular)

    print("Cargando base de datos de caras...")
    
    # En lugar de cargar de una carpeta, cargamos la foto de LinkedIn directamente
    # para este caso de uso específico.
    db = {}
    if os.path.exists(KNOWN_PHOTO):
        try:
            image = face_recognition.load_image_file(KNOWN_PHOTO)
            encodings = face_recognition.face_encodings(image)
            if encodings:
                db["Persona (LinkedIn)"] = encodings[0]
                print(f"[OK] Cara registrada desde: {KNOWN_PHOTO}")
            else:
                print(f"[ADVERTENCIA] No se detectó ninguna cara en: {KNOWN_PHOTO}")
        except Exception as e:
             print(f"[ERROR] Al procesar {KNOWN_PHOTO}: {e}")
    else:
        print(f"[ERROR] No se encontró el archivo de referencia: {KNOWN_PHOTO}")
        exit()

    if not db:
        print("[ERROR] La base de datos está vacía o no se detectaron caras.")
        exit()

    print("\nBuscando mejor match para la foto objetivo...")
    match, dist, is_same = find_best_match(TARGET_PHOTO, db)

    if match is None:
        print("No se pudo obtener un match.")
    else:
        print("\n========== RESULTADO ==========")
        print(f"Mejor match: {match}")
        print(f"Distancia: {dist:.4f}")
        if is_same:
            print("✅ Es MUY probable que sea la MISMA persona.")
        else:
            print("❌ Probablemente NO es la misma persona.")
