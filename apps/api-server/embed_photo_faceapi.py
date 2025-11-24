#!/usr/bin/env python3
"""
Script simple para calcular embedding de Face-API (128 dimensiones) de una foto.
"""

import sys
import json
import face_recognition
from pathlib import Path

def calculate_faceapi_embedding(image_path):
    """Calcula el embedding con face_recognition (128 dimensiones)"""
    try:
        print(f"📸 Cargando imagen: {image_path}")
        image = face_recognition.load_image_file(image_path)
        
        print("🔍 Detectando rostros...")
        encodings = face_recognition.face_encodings(image)
        
        if not encodings:
            print("❌ No se detectó ningún rostro en la imagen")
            return None
        
        if len(encodings) > 1:
            print(f"⚠️  Se detectaron {len(encodings)} rostros. Usando el primero.")
        
        embedding = encodings[0]
        print(f"✅ Embedding calculado: {len(embedding)} dimensiones")
        
        # Convertir números a strings con comillas
        return [str(value) for value in embedding.tolist()]
        
    except Exception as e:
        print(f"❌ Error al calcular embedding: {e}")
        return None


def main():
    # Ruta de la imagen (por defecto agustin-photo.png en el mismo directorio)
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        image_path = "agustin-photo.png"
    
    # Verificar que el archivo existe
    if not Path(image_path).exists():
        print(f"❌ Error: No se encontró el archivo: {image_path}")
        print(f"   Uso: python embed_photo_faceapi.py [ruta_imagen]")
        sys.exit(1)
    
    print("=" * 60)
    print("Face-API Embedding Calculator")
    print("=" * 60)
    print()
    
    # Calcular embedding
    embedding = calculate_faceapi_embedding(image_path)
    
    if embedding is None:
        sys.exit(1)
    
    # Mostrar información del embedding
    print()
    print("=" * 60)
    print("Resultado:")
    print("=" * 60)
    print(f"Dimensiones: {len(embedding)}")
    print(f"Primeros 10 valores: {embedding[:10]}")
    print(f"Últimos 10 valores: {embedding[-10:]}")
    # Convertir temporalmente a float para estadísticas
    embedding_floats = [float(v) for v in embedding]
    print(f"Valor mínimo: {min(embedding_floats):.6f}")
    print(f"Valor máximo: {max(embedding_floats):.6f}")
    print(f"Valor promedio: {sum(embedding_floats)/len(embedding_floats):.6f}")
    
    # Guardar en archivo JSON
    output_file = Path(image_path).stem + "_faceapi_embedding.json"
    output_data = {
        "image_path": str(image_path),
        "dimensions": len(embedding),
        "method": "face_recognition",
        "embedding": embedding
    }
    
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print()
    print(f"💾 Embedding guardado en: {output_file}")
    print("=" * 60)


if __name__ == "__main__":
    main()

